export type VaultKeys = {
  encryption: CryptoKey;
  lookup: CryptoKey;
};

export type LinkVaultData = {
  url: string;
  title: string;
  description: string;
  domain: string;
  faviconUrl: string;
  readStatus: "unread" | "done";
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

export function generateVaultSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return encodeBase64(salt);
}

export async function deriveVaultKeys(
  password: string,
  salt: string,
): Promise<VaultKeys> {
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
      512,
    ),
  );
  const encryption = await crypto.subtle.importKey(
    "raw",
    derived.slice(0, 32),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
  const lookup = await crypto.subtle.importKey(
    "raw",
    derived.slice(32),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  derived.fill(0);
  return { encryption, lookup };
}

export async function createVaultCheck(keys: VaultKeys): Promise<string> {
  return encryptText(keyCheck, keys, keyCheckAAD);
}

export async function verifyVaultCheck(
  encryptedCheck: string,
  keys: VaultKeys,
): Promise<boolean> {
  try {
    return (await decryptText(encryptedCheck, keys, keyCheckAAD)) === keyCheck;
  } catch {
    return false;
  }
}

export async function normalizeAndHashURL(
  rawURL: string,
  keys: VaultKeys,
): Promise<{ url: string; urlHash: string; domain: string }> {
  const trimmed = rawURL.trim();
  const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error("Masukkan URL HTTP atau HTTPS yang valid.");
  }
  parsed.hash = "";
  const url = parsed.toString();
  if (url.length > 2048) throw new Error("URL maksimal 2048 karakter.");
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", keys.lookup, textEncoder.encode(url)),
  );
  return {
    url,
    urlHash: Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join(""),
    domain: parsed.hostname,
  };
}

export async function encryptLink(
  data: LinkVaultData,
  urlHash: string,
  keys: VaultKeys,
): Promise<string> {
  return encryptText(JSON.stringify(data), keys, `tumpuk-link-v1:${urlHash}`);
}

export async function decryptLink(
  ciphertext: string,
  urlHash: string,
  keys: VaultKeys,
): Promise<LinkVaultData> {
  const json = await decryptText(ciphertext, keys, `tumpuk-link-v1:${urlHash}`);
  const data: unknown = JSON.parse(json);
  if (!isLinkVaultData(data)) throw new Error("Data link terenkripsi tidak valid.");
  return {
    ...data,
    readStatus: data.readStatus === "reading" ? "unread" : data.readStatus,
  };
}

async function encryptText(
  value: string,
  keys: VaultKeys,
  additionalData: string,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: textEncoder.encode(additionalData),
      },
      keys.encryption,
      textEncoder.encode(value),
    ),
  );
  const envelope = new Uint8Array(1 + iv.length + encrypted.length);
  envelope[0] = 1;
  envelope.set(iv, 1);
  envelope.set(encrypted, 13);
  return encodeBase64(envelope);
}

async function decryptText(
  ciphertext: string,
  keys: VaultKeys,
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

function encodeBase64(value: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < value.length; offset += 0x8000) {
    binary += String.fromCharCode(...value.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isLinkVaultData(
  value: unknown,
): value is Omit<LinkVaultData, "readStatus"> & {
  readStatus: LinkVaultData["readStatus"] | "reading";
} {
  if (!value || typeof value !== "object") return false;
  const link = value as Record<string, unknown>;
  return (
    typeof link.url === "string" &&
    typeof link.title === "string" &&
    typeof link.description === "string" &&
    typeof link.domain === "string" &&
    typeof link.faviconUrl === "string" &&
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
