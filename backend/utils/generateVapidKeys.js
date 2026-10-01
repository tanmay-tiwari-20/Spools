import { generateKeyPairSync } from "crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const publicJwk = publicKey.export({ format: "jwk" });
const privateJwk = privateKey.export({ format: "jwk" });
const decode = (value) => Buffer.from(value, "base64url");
const publicKeyBytes = Buffer.concat([
  Buffer.from([4]),
  decode(publicJwk.x),
  decode(publicJwk.y),
]);

const values = {
  PUSH_VAPID_PUBLIC_KEY: publicKeyBytes.toString("base64url"),
  PUSH_VAPID_PRIVATE_KEY: privateJwk.d,
  PUSH_VAPID_SUBJECT: "https://spools.onrender.com/",
};

if (process.argv.includes("--write-local")) {
  const fs = await import("fs/promises");
  const path = await import("path");
  const envPath = path.resolve(process.cwd(), ".env");
  let existing = "";
  try {
    existing = await fs.readFile(envPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const missing = Object.entries(values).filter(([key]) =>
    !new RegExp(`^${key}=`, "m").test(existing)
  );
  const keyPairMissing = ["PUSH_VAPID_PUBLIC_KEY", "PUSH_VAPID_PRIVATE_KEY"]
    .filter((key) => missing.some(([missingKey]) => missingKey === key));
  if (keyPairMissing.length === 1) {
    throw new Error("The local .env contains only one VAPID key. Remove it before generating a matching pair.");
  }
  if (missing.length) {
    const suffix = existing && !existing.endsWith("\n") ? "\n" : "";
    await fs.appendFile(
      envPath,
      `${suffix}${missing.map(([key, value]) => `${key}=${value}`).join("\n")}\n`,
      "utf8"
    );
  }
  process.stdout.write(`Added ${missing.length} missing push key setting(s) to the local .env file.\n`);
} else {
  for (const [key, value] of Object.entries(values)) {
    process.stdout.write(`${key}=${value}\n`);
  }
}
