export type VaultKeys = Record<string, never>;

export type LinkVaultData = {
  url: string;
  title: string;
  description: string;
  domain: string;
  faviconUrl: string;
  previewImageUrl: string;
  readStatus: "unread" | "done";
  reminderAt?: string;
  metadataStatus: "pending" | "ready" | "unavailable";
  tags: string[];
  collections: string[];
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
export async function normalizeAndHashURL(
  rawURL: string,
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
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", textEncoder.encode(url)),
  );
  return {
    url,
    urlHash: Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join(""),
    domain: parsed.hostname,
  };
}

export async function encryptLink(data: LinkVaultData): Promise<string> {
  return encodeBase64(textEncoder.encode(JSON.stringify(data)));
}

export async function decryptLink(ciphertext: string): Promise<LinkVaultData> {
  const json = textDecoder.decode(decodeBase64(ciphertext));
  const data: unknown = JSON.parse(json);
  if (!isLinkVaultData(data)) throw new Error("Data link tidak valid.");
  return {
    ...data,
    previewImageUrl: data.previewImageUrl ?? "",
    readStatus: data.readStatus === "reading" ? "unread" : data.readStatus,
  };
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
  previewImageUrl?: string;
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
