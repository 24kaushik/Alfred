import crypto from "crypto";

const algorithm: string = process.env.ENCRYPTION_ALGORITHM!;

if (!algorithm || !process.env.ENCRYPTION_KEY) {
  throw new Error(
    "ENCRYPTION_ALGORITHM or ENCRYPTION_KEY environment variable is not set",
  );
}

function encrypt(text: string) {
  const iv = crypto.randomBytes(16); // unique per encryption
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + encrypted data (needed for decryption)
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(data: `${string}:${string}`) {
  const [ivHex, encryptedText] = data.split(":") as [string, string];

  if (!ivHex || !encryptedText) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export { encrypt, decrypt };