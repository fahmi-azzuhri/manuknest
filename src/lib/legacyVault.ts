export type LegacyVaultKeys = {
  encryption: CryptoKey;
};

export type LegacyLinkData = {
  url: string;
  title: string;
  description: string;
  domain: string;
  faviconUrl: string;
  previewImageUrl?: string;
  readStatus: "unread" | "reading" | "done";
  reminderAt?: string;
  metadataStatus: "pending" | "ready" | "unavailable";
  tags: string[];
  collections: string[];
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const keyCheck = "tumpuk-vault-key-v1";
const keyCheckAAD = "tumpuk-vault-check-v1";
const keyDerivationIterations = 600_000;

export async function deriveLegacyVaultKey(
  password: string,
  salt: string,
): Promise<LegacyVaultKeys> {
  const saltBytes = decodeBase64(salt);
  if (saltBytes.length !== 16) throw new Error("Salt enkripsi akun tidak valid.");
  const saltBuffer = new ArrayBuffer(saltBytes.length);
  new Uint8Array(saltBuffer).set(saltBytes);
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: saltBuffer,
        iterations: keyDerivationIterations,
      },
      passwordKey,
      256,
    ),
  );
  const encryption = await crypto.subtle.importKey(
    "raw",
    derived,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  derived.fill(0);
  return { encryption };
}

export async function verifyLegacyVaultKey(
  encryptedCheck: string,
  keys: LegacyVaultKeys,
): Promise<boolean> {
  try {
    return (await decryptText(encryptedCheck, keys, keyCheckAAD)) === keyCheck;
  } catch {
    return false;
  }
}

export async function decryptLegacyLink(
  ciphertext: string,
  urlHash: string,
  keys: LegacyVaultKeys,
): Promise<LegacyLinkData> {
  const json = await decryptText(
    ciphertext,
    keys,
    `tumpuk-link-v1:${urlHash}`,
  );
  const value: unknown = JSON.parse(json);
  if (!isLegacyLinkData(value)) {
    throw new Error("Data link terenkripsi tidak valid.");
  }
  return {
    ...value,
    previewImageUrl: value.previewImageUrl ?? "",
    readStatus: value.readStatus === "reading" ? "unread" : value.readStatus,
  };
}

async function decryptText(
  ciphertext: string,
  keys: LegacyVaultKeys,
  additionalData: string,
): Promise<string> {
  const envelope = decodeBase64(ciphertext);
  if (envelope.length < 29 || envelope[0] !== 1) {
    throw new Error("Data terenkripsi tidak didukung.");
  }
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: envelope.slice(1, 13),
      additionalData: textEncoder.encode(additionalData),
    },
    keys.encryption,
    envelope.slice(13),
  );
  return textDecoder.decode(decrypted);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isLegacyLinkData(value: unknown): value is LegacyLinkData {
  if (!value || typeof value !== "object") return false;
  const link = value as Record<string, unknown>;
  return (
    typeof link.url === "string" &&
    typeof link.title === "string" &&
    typeof link.description === "string" &&
    typeof link.domain === "string" &&
    typeof link.faviconUrl === "string" &&
    (link.previewImageUrl === undefined ||
      typeof link.previewImageUrl === "string") &&
    (link.reminderAt === undefined ||
      (typeof link.reminderAt === "string" &&
        Number.isFinite(Date.parse(link.reminderAt)))) &&
    (link.readStatus === "unread" ||
      link.readStatus === "reading" ||
      link.readStatus === "done") &&
    (link.metadataStatus === "pending" ||
      link.metadataStatus === "ready" ||
      link.metadataStatus === "unavailable") &&
    Array.isArray(link.tags) &&
    link.tags.every((tag) => typeof tag === "string") &&
    Array.isArray(link.collections) &&
    link.collections.every((collection) => typeof collection === "string")
  );
}
