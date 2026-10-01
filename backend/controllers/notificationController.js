import User from "../models/userModel.js";
import PushSubscription from "../models/pushSubscriptionModel.js";
import { getPushConfiguration } from "../utils/webPush.js";

const preferenceKeys = [
  "pauseNotifications",
  "notifyLikes",
  "notifyReplies",
  "notifyFollowers",
  "notifyMessages",
  "soundEffects",
];

const sanitizePreferences = (preferences = {}) =>
  Object.fromEntries(
    preferenceKeys
      .filter((key) => typeof preferences[key] === "boolean")
      .map((key) => [key, preferences[key]])
  );

export const getNotificationConfig = (_req, res) => {
  res.status(200).json(getPushConfiguration());
};

export const saveNotificationPreferences = async (req, res) => {
  try {
    const preferences = sanitizePreferences(req.body);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: Object.fromEntries(Object.entries(preferences).map(([key, value]) => [`notificationPreferences.${key}`, value])) },
      { new: true }
    ).select("notificationPreferences");

    if (!user) return res.status(404).json({ error: "User not found." });
    return res.status(200).json({ notificationPreferences: user.notificationPreferences });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const subscribeToNotifications = async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (
      typeof endpoint !== "string" ||
      !endpoint.startsWith("https://") ||
      typeof keys?.p256dh !== "string" ||
      typeof keys?.auth !== "string"
    ) {
      return res.status(400).json({ error: "A valid browser push subscription is required." });
    }

    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      { $set: { userId: req.user._id, endpoint, keys } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const preferences = sanitizePreferences(req.body.preferences);
    if (Object.keys(preferences).length) {
      await User.updateOne(
        { _id: req.user._id },
        { $set: Object.fromEntries(Object.entries(preferences).map(([key, value]) => [`notificationPreferences.${key}`, value])) }
      );
    }

    return res.status(201).json({ subscriptionId: subscription._id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const unsubscribeFromNotifications = async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (typeof endpoint !== "string") {
      return res.status(400).json({ error: "A push subscription endpoint is required." });
    }

    await PushSubscription.deleteOne({ userId: req.user._id, endpoint });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getNotificationSubscription = async (req, res) => {
  try {
    const count = await PushSubscription.countDocuments({ userId: req.user._id });
    return res.status(200).json({ subscribed: count > 0 });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
