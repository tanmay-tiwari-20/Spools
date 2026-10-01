import {
  createECDH,
  createHmac,
  createCipheriv,
  createPrivateKey,
  randomBytes,
  sign as cryptoSign,
} from "crypto";
import { io, getRecipientSocketId, isUserActivelyViewing } from "../socket/socket.js";
import PushSubscription from "../models/pushSubscriptionModel.js";
import User from "../models/userModel.js";

const base64Url = (value) => Buffer.from(value).toString("base64url");
const fromBase64Url = (value) => Buffer.from(value, "base64url");

const getVapidConfiguration = () => ({
  publicKey: process.env.PUSH_VAPID_PUBLIC_KEY,
  privateKey: process.env.PUSH_VAPID_PRIVATE_KEY,
  subject: process.env.PUSH_VAPID_SUBJECT || "https://spools.onrender.com/",
});

export const getPushConfiguration = () => {
  const { publicKey, privateKey } = getVapidConfiguration();
  return { publicKey: publicKey || "", enabled: Boolean(publicKey && privateKey) };
};

const createVapidPrivateKey = (publicKey, privateKey) => {
  const publicBytes = fromBase64Url(publicKey);
  if (publicBytes.length !== 65 || publicBytes[0] !== 4) {
    throw new Error("PUSH_VAPID_PUBLIC_KEY must be an uncompressed P-256 public key.");
  }

  return createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: base64Url(publicBytes.subarray(1, 33)),
      y: base64Url(publicBytes.subarray(33, 65)),
      d: privateKey,
    },
    format: "jwk",
  });
};

const createVapidToken = (endpoint, publicKey, privateKey, subject) => {
  const audience = new URL(endpoint).origin;
  const header = base64Url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const claims = base64Url(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, sub: subject }));
  const signingInput = `${header}.${claims}`;
  const signature = cryptoSign("sha256", Buffer.from(signingInput), {
    key: createVapidPrivateKey(publicKey, privateKey),
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${base64Url(signature)}`;
};

const hkdfExtract = (salt, inputKeyMaterial) =>
  createHmac("sha256", salt).update(inputKeyMaterial).digest();

const hkdfExpand = (pseudoRandomKey, info, length) => {
  const output = [];
  let previous = Buffer.alloc(0);
  for (let index = 1; Buffer.concat(output).length < length; index += 1) {
    previous = createHmac("sha256", pseudoRandomKey)
      .update(Buffer.concat([previous, info, Buffer.from([index])]))
      .digest();
    output.push(previous);
  }
  return Buffer.concat(output).subarray(0, length);
};

const encryptPayload = (subscription, payload) => {
  const userPublicKey = fromBase64Url(subscription.keys.p256dh);
  const authSecret = fromBase64Url(subscription.keys.auth);
  if (userPublicKey.length !== 65 || authSecret.length !== 16) {
    throw new Error("The saved push subscription keys are invalid.");
  }

  const ephemeralKey = createECDH("prime256v1");
  ephemeralKey.generateKeys();
  const serverPublicKey = ephemeralKey.getPublicKey();
  const sharedSecret = ephemeralKey.computeSecret(userPublicKey);
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0"),
    userPublicKey,
    serverPublicKey,
  ]);
  const inputKeyMaterial = hkdfExpand(hkdfExtract(authSecret, sharedSecret), keyInfo, 32);

  const salt = randomBytes(16);
  const pseudoRandomKey = hkdfExtract(salt, inputKeyMaterial);
  const contentKey = hkdfExpand(pseudoRandomKey, Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = hkdfExpand(pseudoRandomKey, Buffer.from("Content-Encoding: nonce\0"), 12);
  const cipher = createCipheriv("aes-128-gcm", contentKey, nonce);
  const clearText = Buffer.concat([Buffer.from(JSON.stringify(payload)), Buffer.from([2])]);
  const ciphertext = Buffer.concat([cipher.update(clearText), cipher.final(), cipher.getAuthTag()]);
  const recordHeader = Buffer.alloc(21);
  salt.copy(recordHeader, 0);
  recordHeader.writeUInt32BE(4096, 16);
  recordHeader[20] = serverPublicKey.length;
  return Buffer.concat([recordHeader, serverPublicKey, ciphertext]);
};

const isAllowedPushEndpoint = (endpoint) => {
  try {
    const url = new URL(endpoint);
    const allowedDomains = ["googleapis.com", "mozilla.com", "apple.com", "windows.com"];
    return url.protocol === "https:" && allowedDomains.some(
      (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

export const sendWebPush = async (subscription, payload) => {
  const { publicKey, privateKey, subject } = getVapidConfiguration();
  if (!publicKey || !privateKey) return { skipped: true, reason: "Push is not configured." };
  if (!isAllowedPushEndpoint(subscription.endpoint)) {
    return { skipped: true, reason: "Unsupported push service endpoint." };
  }

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${createVapidToken(subscription.endpoint, publicKey, privateKey, subject)}, k=${publicKey}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
    },
    body: encryptPayload(subscription, payload),
    signal: AbortSignal.timeout(10000),
  });

  if (response.status === 404 || response.status === 410) {
    await PushSubscription.deleteOne({ _id: subscription._id });
    return { expired: true };
  }
  if (!response.ok) throw new Error(`Push service returned ${response.status}.`);
  return { sent: true };
};

const preferenceForType = {
  message: "notifyMessages",
  like: "notifyLikes",
  reply: "notifyReplies",
  follow: "notifyFollowers",
};

export const deliverUserNotification = async (userId, notification) => {
  try {
    const type = notification.type;
    const preferenceKey = preferenceForType[type];
    if (!preferenceKey) return;

    const recipientId = String(userId);
    const liveNotification = {
      ...notification,
      url: notification.url || "/",
      icon: "/pwa-192x192.png",
    };
    const recipient = await User.findById(userId).select("notificationPreferences");
    const preferences = recipient?.notificationPreferences || {};
    if (preferences.pauseNotifications || preferences[preferenceKey] === false) return;

    const socketId = getRecipientSocketId(recipientId);
    if (socketId) io.to(socketId).emit("appNotification", liveNotification);
    if (isUserActivelyViewing(recipientId)) return;

    const subscriptions = await PushSubscription.find({ userId });
    await Promise.allSettled(
      subscriptions.map((subscription) => sendWebPush(subscription, liveNotification))
    );
  } catch (error) {
    console.error("Could not deliver notification:", error.message);
  }
};
