import type { LinkVaultData } from "../../lib/vault";
import type { User } from "../../lib/api";

export type SavedLink = {
  id: number;
  urlHash: string;
  title: string;
  url: string;
  href: string;
  category: string;
  note: string;
  color: string;
  initials: string;
  vault: LinkVaultData;
  shared: boolean;
  createdAt: string;
};

export type AuthSession = {
  token: string;
  user: User;
};

export const tones = ["#fbc4ea", "#ffe3a3", "#bfe8fb", "#cdf7b5", "#dccdfa"];

export const categoryOptions = [
  "Tutorial",
  "Desain",
  "Tools",
  "Development",
  "Productivity",
  "Lagu",
  "Film",
  "Artikel",
  "Edukasi",
  "Berita",
  "Referensi",
  "Other",
];

export function formatShortDate(
  value: string,
  locale: "id" | "en" = "id",
): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function formatAccountDate(
  value: string,
  locale: "id" | "en" = "id",
): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    return locale === "id" ? "Tanggal tidak tersedia" : "Date unavailable";
  }
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    dateStyle: "long",
  }).format(date);
}
