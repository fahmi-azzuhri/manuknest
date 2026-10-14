import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bookmark,
  CalendarDays,
  Check,
  ExternalLink,
  Folder,
  House,
  Feather,
  Heart,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  Telescope,
  UserRound,
  X,
} from "lucide-react";
import Mascot from "./components/Mascot";
import CardStack from "./components/CardStack";
import ProfileMusicPlayer from "./components/ProfileMusicPlayer";
import SharedProfilePage from "./components/SharedProfilePage";
import {
  ApiError,
  request,
  type LinkItem,
  type PopularLink,
  type ProfileStats,
  type User,
} from "./lib/api";
import {
  createVaultCheck,
  decryptLink,
  deriveVaultKeys,
  encryptLink,
  generateVaultSalt,
  normalizeAndHashURL,
  verifyVaultCheck,
  type LinkVaultData,
  type VaultKeys,
} from "./lib/vault";

type SavedLink = {
  id: number;
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
const sessionKey = "tumpuk.session";
// Warna pastel kartu, diputar berdasarkan id supaya tiap link punya "wajah" sendiri.
const tones = ["#fbc4ea", "#ffe3a3", "#bfe8fb", "#cdf7b5", "#dccdfa"];
const categoryOptions = [
  "Tutorial",
  "Desain",
  "Tools",
  "Lagu",
  "Film",
  "Artikel",
  "Edukasi",
  "Berita",
  "Referensi",
  "Other",
];

type AuthSession = { token: string; user: User };
type AuthResponse = AuthSession;

function readSession(): AuthSession | null {
  const stored = window.sessionStorage.getItem(sessionKey);
  if (!stored) return null;
  try {
    const value: unknown = JSON.parse(stored);
    if (
      value &&
      typeof value === "object" &&
      "token" in value &&
      typeof value.token === "string" &&
      "user" in value &&
      value.user &&
      typeof value.user === "object" &&
      "id" in value.user &&
      typeof value.user.id === "number" &&
      "email" in value.user &&
      typeof value.user.email === "string"
    ) {
      const user = value.user as Record<string, unknown>;
      return {
        token: value.token,
        user: {
          id: user.id as number,
          email: user.email as string,
          username: typeof user.username === "string" ? user.username : "",
          musicVideoId:
            typeof user.musicVideoId === "string" ? user.musicVideoId : "",
          createdAt: typeof user.createdAt === "string" ? user.createdAt : "",
          encryptionSalt:
            typeof user.encryptionSalt === "string" ? user.encryptionSalt : "",
          encryptionCheck:
            typeof user.encryptionCheck === "string"
              ? user.encryptionCheck
              : "",
        },
      };
    }
  } catch {
    window.sessionStorage.removeItem(sessionKey);
    return null;
  }
  window.sessionStorage.removeItem(sessionKey);
  return null;
}

function toSavedLink(
  id: number,
  vault: LinkVaultData,
  createdAt: string,
  shared = false,
): SavedLink {
  const parsed = new URL(vault.url);
  return {
    id,
    title: vault.title || vault.domain,
    url: `${vault.domain}${parsed.pathname}${parsed.search}`,
    href: vault.url,
    category:
      vault.tags[0] === "Belajar" ? "Tutorial" : (vault.tags[0] ?? "Tutorial"),
    note: vault.description || "Belum ada catatan.",
    color: tones[id % tones.length],
    initials: vault.domain[0]?.toUpperCase() ?? "?",
    vault,
    shared,
    createdAt,
  };
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatAccountDate(value: string): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

export default function App() {
  const filterDrag = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    moved: boolean;
  } | null>(null);
  const filterInertiaFrame = useRef<number | null>(null);
  const suppressFilterClick = useRef(false);
  const [session, setSession] = useState<AuthSession | null>(readSession);
  const [vaultKeys, setVaultKeys] = useState<VaultKeys | null>(null);
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [popularLinks, setPopularLinks] = useState<PopularLink[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [popularError, setPopularError] = useState("");
  const [reloadPopular, setReloadPopular] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [reloadLinks, setReloadLinks] = useState(0);
  const [isLoading, setIsLoading] = useState(() => session !== null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authMusicUrl, setAuthMusicUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingLinkID, setDeletingLinkID] = useState<number | null>(null);
  const [likingPopularID, setLikingPopularID] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState("");
  const [category, setCategory] = useState("Tutorial");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sharePublic, setSharePublic] = useState(false);
  const [activeNav, setActiveNav] = useState("Home");
  const [sharedProfileUsername, setSharedProfileUsername] = useState("");
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileReload, setProfileReload] = useState(0);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileEditUsername, setProfileEditUsername] = useState("");
  const [profileEditMusicUrl, setProfileEditMusicUrl] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileSaveNotice, setProfileSaveNotice] = useState("");
  const filters = useMemo(
    () => [
      "Semua",
      ...new Set([...categoryOptions, ...links.map((link) => link.category)]),
    ],
    [links],
  );

  useEffect(
    () => () => {
      if (filterInertiaFrame.current !== null) {
        cancelAnimationFrame(filterInertiaFrame.current);
      }
    },
    [],
  );
  const mascotSpeech =
    links.length >= 3
      ? "Cuit! Ada link menarik? Simpan dulu, ya."
      : links.length === 0
        ? "Simpan sampai 3 link agar Tiko bisa menetas."
        : `Simpan ${3 - links.length} link lagi, yuk, biar telurnya menetas.`;

  function showNotice(message: string, isError = false) {
    setNotice(message);
    setNoticeIsError(isError);
  }

  useEffect(() => {
    if (!showAdd) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowAdd(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showAdd]);

  useEffect(() => {
    if (!session || !vaultKeys) {
      setLinks([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    const token = session.token;
    const keys = vaultKeys;
    setIsLoading(true);
    setLoadError("");
    async function loadLinks() {
      try {
        await request<User>("/api/me", { token });
        const savedLinks = await request<LinkItem[]>("/api/links", { token });
        const decodedLinks: SavedLink[] = [];
        for (const savedLink of savedLinks) {
          if (savedLink.ciphertext) {
            const vault = await decryptLink(
              savedLink.ciphertext,
              savedLink.urlHash,
              keys,
            );
            decodedLinks.push(
              toSavedLink(
                savedLink.id,
                vault,
                savedLink.createdAt,
                savedLink.shared,
              ),
            );
            continue;
          }
          const legacy = savedLink.legacy;
          if (!legacy)
            throw new Error("Ada link lama yang datanya tidak lengkap.");
          const normalized = await normalizeAndHashURL(legacy.url, keys);
          const vault: LinkVaultData = {
            url: normalized.url,
            title: legacy.title || normalized.domain,
            description: legacy.description || "",
            domain: normalized.domain,
            faviconUrl: legacy.faviconUrl || "",
            readStatus: legacy.readStatus || "unread",
            metadataStatus: legacy.metadataStatus || "unavailable",
            tags: legacy.tags.map((tag) => tag.name),
            collections: legacy.collections.map(
              (collection) => collection.name,
            ),
          };
          const ciphertext = await encryptLink(vault, normalized.urlHash, keys);
          await request<{ link: LinkItem }>(`/api/links/${savedLink.id}`, {
            method: "PATCH",
            token,
            body: { urlHash: normalized.urlHash, ciphertext },
          });
          decodedLinks.push(
            toSavedLink(
              savedLink.id,
              vault,
              savedLink.createdAt,
              savedLink.shared,
            ),
          );
        }
        if (active) {
          setLinks(decodedLinks);
          setLoadError("");
        }
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          window.sessionStorage.removeItem(sessionKey);
          setSession(null);
          setAuthError(error.message);
        } else {
          setLoadError(
            error instanceof Error ? error.message : "Link belum bisa dimuat.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadLinks();
    return () => {
      active = false;
    };
  }, [session, reloadLinks, vaultKeys]);

  useEffect(() => {
    if (!session || activeNav !== "Explore" || sharedProfileUsername) return;
    let active = true;
    setPopularLoading(true);
    setPopularError("");
    request<PopularLink[]>("/api/popular", { token: session.token })
      .then((result) => {
        if (active) setPopularLinks(result);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          window.sessionStorage.removeItem(sessionKey);
          setSession(null);
          setAuthError(error.message);
          return;
        }
        setPopularError(
          error instanceof Error
            ? error.message
            : "Link Explore belum bisa dimuat.",
        );
      })
      .finally(() => {
        if (active) setPopularLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session, activeNav, reloadPopular, sharedProfileUsername]);

  useEffect(() => {
    if (!session || activeNav !== "Profile") return;
    let active = true;
    const token = session.token;
    setProfileLoading(true);
    setProfileError("");
    Promise.all([
      request<User>("/api/me", { token }),
      request<ProfileStats>("/api/me/stats", { token }),
    ])
      .then(([user, stats]) => {
        if (!active) return;
        setProfileStats(stats);
        setSession((current) => {
          if (!current) return current;
          const updated = { ...current, user };
          window.sessionStorage.setItem(sessionKey, JSON.stringify(updated));
          return updated;
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          window.sessionStorage.removeItem(sessionKey);
          setSession(null);
          setAuthError(error.message);
        }
        setProfileError(
          error instanceof Error ? error.message : "Profil belum bisa dimuat.",
        );
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.token, activeNav, profileReload]);

  async function prepareVault(
    user: User,
    token: string,
    password: string,
  ): Promise<{ user: User; keys: VaultKeys }> {
    if (user.encryptionSalt && user.encryptionCheck) {
      const keys = await deriveVaultKeys(password, user.encryptionSalt);
      if (!(await verifyVaultCheck(user.encryptionCheck, keys))) {
        throw new Error("Kunci enkripsi arsip tidak cocok dengan akun ini.");
      }
      return { user, keys };
    }
    if (user.encryptionSalt || user.encryptionCheck) {
      throw new Error("Pengaturan enkripsi akun belum lengkap. Hubungi admin.");
    }
    const encryptionSalt = generateVaultSalt();
    const keys = await deriveVaultKeys(password, encryptionSalt);
    const encryptionCheck = await createVaultCheck(keys);
    let configured: User;
    try {
      configured = await request<User>("/api/me/encryption", {
        method: "POST",
        token,
        body: { encryptionSalt, encryptionCheck },
      });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 409) throw error;
      configured = await request<User>("/api/me", { token });
    }
    const verifiedKeys = await deriveVaultKeys(
      password,
      configured.encryptionSalt,
    );
    if (!(await verifyVaultCheck(configured.encryptionCheck, verifiedKeys))) {
      throw new Error("Kunci enkripsi arsip tidak cocok dengan akun ini.");
    }
    return { user: configured, keys: verifiedKeys };
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      let result: AuthResponse;
      let keys: VaultKeys;
      if (authMode === "register") {
        const encryptionSalt = generateVaultSalt();
        keys = await deriveVaultKeys(authPassword, encryptionSalt);
        const encryptionCheck = await createVaultCheck(keys);
        result = await request<AuthResponse>("/api/auth/register", {
          method: "POST",
          body: {
            email: authEmail,
            password: authPassword,
            username: authUsername,
            musicUrl: authMusicUrl,
            encryptionSalt,
            encryptionCheck,
          },
        });
      } else {
        result = await request<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: { email: authEmail, password: authPassword },
        });
        const prepared = await prepareVault(
          result.user,
          result.token,
          authPassword,
        );
        result = { ...result, user: prepared.user };
        keys = prepared.keys;
      }
      window.sessionStorage.setItem(sessionKey, JSON.stringify(result));
      setVaultKeys(keys);
      setSession(result);
      setAuthUsername("");
      setAuthMusicUrl("");
      setAuthPassword("");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Akun belum bisa dibuka.",
      );
    } finally {
      setAuthBusy(false);
    }
  }

  async function unlockVault(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setAuthBusy(true);
    setAuthError("");
    try {
      const result = await request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { email: session.user.email, password: authPassword },
      });
      const prepared = await prepareVault(
        result.user,
        result.token,
        authPassword,
      );
      const unlocked = { ...result, user: prepared.user };
      window.sessionStorage.setItem(sessionKey, JSON.stringify(unlocked));
      setVaultKeys(prepared.keys);
      setSession(unlocked);
      setAuthPassword("");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Arsip belum bisa dibuka.",
      );
    } finally {
      setAuthBusy(false);
    }
  }

  function signOut() {
    window.sessionStorage.removeItem(sessionKey);
    setSession(null);
    setVaultKeys(null);
    setLinks([]);
    setAuthError("");
    showNotice("");
    setLoadError("");
  }

  const isHome = activeNav === "Home";
  const isSavedView = activeNav === "Saved";
  const isPopularView = activeNav === "Explore";
  const isProfileView = activeNav === "Profile";
  const isSharedProfileView = sharedProfileUsername !== "";
  const visibleLinks = useMemo(
    () =>
      links.filter(
        (link) =>
          (activeFilter === "Semua" || link.category === activeFilter) &&
          `${link.title} ${link.url} ${link.note}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [links, activeFilter, query],
  );
  const recentLinks = links.slice(0, 3);
  const displayedLinks = isSavedView ? visibleLinks : recentLinks;

  function openAdd(initialUrl = "") {
    setUrl(initialUrl);
    setTitle("");
    setAddError("");
    setShowAdd(true);
  }

  function openHome() {
    setSharedProfileUsername("");
    setActiveNav("Home");
    setQuery("");
    setActiveFilter("Semua");
  }

  function openArchive() {
    setSharedProfileUsername("");
    setActiveNav("Saved");
    setQuery("");
    setActiveFilter("Semua");
  }

  function openPopular() {
    setSharedProfileUsername("");
    setActiveNav("Explore");
  }

  function openSharedProfile(username: string) {
    setSharedProfileUsername(username);
    setActiveNav("Explore");
  }

  function openProfile() {
    setSharedProfileUsername("");
    setActiveNav("Profile");
    setProfileEditOpen(false);
    setProfileSaveError("");
    setProfileSaveNotice("");
  }

  function editProfile() {
    setProfileEditUsername(session?.user.username ?? "");
    setProfileEditMusicUrl(
      session?.user.musicVideoId
        ? `https://music.youtube.com/watch?v=${session.user.musicVideoId}`
        : "",
    );
    setProfileSaveError("");
    setProfileSaveNotice("");
    setProfileEditOpen(true);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || profileSaving) return;
    setProfileSaving(true);
    setProfileSaveError("");
    setProfileSaveNotice("");
    try {
      const user = await request<User>("/api/me/profile", {
        method: "PATCH",
        token: session.token,
        body: {
          username: profileEditUsername,
          musicUrl: profileEditMusicUrl,
        },
      });
      setSession((current) => {
        if (!current) return current;
        const updated = { ...current, user };
        window.sessionStorage.setItem(sessionKey, JSON.stringify(updated));
        return updated;
      });
      setProfileEditOpen(false);
      setProfileSaveNotice("Profil berhasil diperbarui.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.sessionStorage.removeItem(sessionKey);
        setSession(null);
        setAuthError(error.message);
      }
      setProfileSaveError(
        error instanceof Error ? error.message : "Profil belum bisa disimpan.",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function togglePopularLike(link: PopularLink) {
    if (!session || likingPopularID !== null || link.isOwner) return;
    setLikingPopularID(link.id);
    try {
      const result = await request<{ liked: boolean; likeCount: number }>(
        `/api/popular/${link.id}/like`,
        {
          method: link.likedByMe ? "DELETE" : "POST",
          token: session.token,
        },
      );
      setPopularLinks((current) =>
        current.map((item) =>
          item.id === link.id
            ? { ...item, likedByMe: result.liked, likeCount: result.likeCount }
            : item,
        ),
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.sessionStorage.removeItem(sessionKey);
        setSession(null);
        setAuthError(error.message);
      } else {
        showNotice(
          error instanceof Error
            ? error.message
            : "Suka belum bisa diperbarui.",
          true,
        );
      }
    } finally {
      setLikingPopularID(null);
    }
  }

  async function saveLink() {
    if (!session || !vaultKeys) return;
    const trimmed = url.trim();
    if (!trimmed) {
      setAddError("Tempel link yang ingin kamu simpan.");
      return;
    }
    let normalized: Awaited<ReturnType<typeof normalizeAndHashURL>>;
    try {
      normalized = await normalizeAndHashURL(trimmed, vaultKeys);
    } catch {
      setAddError("Format link belum valid. Coba periksa lagi.");
      return;
    }
    const savedTitle = title.trim() || normalized.domain;
    if (sharePublic && new TextEncoder().encode(savedTitle).length > 500) {
      setAddError("Judul untuk link yang dibagikan terlalu panjang.");
      return;
    }
    const vault: LinkVaultData = {
      url: normalized.url,
      title: savedTitle,
      description: note.trim(),
      domain: normalized.domain,
      faviconUrl: "",
      readStatus: "unread",
      metadataStatus: "unavailable",
      tags: [category],
      collections: [],
    };
    setAddError("");
    setIsSaving(true);
    try {
      const ciphertext = await encryptLink(
        vault,
        normalized.urlHash,
        vaultKeys,
      );
      const result = await request<{ link: LinkItem }>("/api/links", {
        method: "POST",
        token: session.token,
        body: {
          urlHash: normalized.urlHash,
          ciphertext,
          ...(sharePublic
            ? { share: { url: normalized.url, title: vault.title } }
            : {}),
        },
      });
      setLinks((current) => [
        toSavedLink(
          result.link.id,
          vault,
          result.link.createdAt,
          result.link.shared,
        ),
        ...current,
      ]);
      setUrl("");
      setTitle("");
      setNote("");
      setSharePublic(false);
      setShowAdd(false);
      showNotice(
        sharePublic
          ? "Link disimpan dan dibagikan di Explore."
          : "Link berhasil disimpan. Tiko ikut senang!",
      );
      openArchive();
      window.setTimeout(() => showNotice(""), 3000);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.sessionStorage.removeItem(sessionKey);
        setSession(null);
        setAuthError(error.message);
      } else {
        setAddError(
          error instanceof Error ? error.message : "Link belum bisa disimpan.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSavedLink(link: SavedLink) {
    if (!session || deletingLinkID !== null) return;
    if (
      !window.confirm(
        `Hapus "${link.title}" dari arsipmu? Tindakan ini tidak bisa dibatalkan.`,
      )
    ) {
      return;
    }
    setDeletingLinkID(link.id);
    try {
      await request<void>(`/api/links/${link.id}`, {
        method: "DELETE",
        token: session.token,
      });
      setLinks((current) => current.filter((item) => item.id !== link.id));
      if (link.shared) setReloadPopular((current) => current + 1);
      showNotice(`"${link.title}" dihapus dari arsip.`);
      window.setTimeout(() => showNotice(""), 3000);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.sessionStorage.removeItem(sessionKey);
        setSession(null);
        setAuthError(error.message);
      } else {
        showNotice(
          error instanceof Error ? error.message : "Link belum bisa dihapus.",
          true,
        );
      }
    } finally {
      setDeletingLinkID(null);
    }
  }

  if (!session) {
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-labelledby="auth-title">
          <a className="brand auth-brand" href="/" aria-label="Manuknest">
            <span className="brand-icon">
              <Feather size={18} />
            </span>
            <span>Manuknest</span>
          </a>
          <div className="auth-copy">
            <h1 id="auth-title">
              {authMode === "register" ? "Buat sarangmu." : "Masuk ke sarang"}
            </h1>
            <p>
              {authMode === "register"
                ? "Daftar untuk mulai menyimpan halaman yang ingin kamu temukan lagi."
                : "Masuk untuk melanjutkan ke koleksi link yang kamu simpan"}
            </p>
          </div>
          <form className="auth-form" onSubmit={authenticate}>
            {authMode === "register" && (
              <label className="field-label">
                Username
                <input
                  type="text"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-z0-9][A-Za-z0-9_]{2,23}"
                  value={authUsername}
                  onChange={(event) => setAuthUsername(event.target.value)}
                  placeholder="contoh: tiko_7"
                />
              </label>
            )}
            <label className="field-label">
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="nama@email.com"
              />
            </label>
            <label className="field-label">
              Kata sandi
              <input
                type="password"
                autoComplete={
                  authMode === "register" ? "new-password" : "current-password"
                }
                required
                minLength={authMode === "register" ? 10 : undefined}
                maxLength={72}
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder={
                  authMode === "register"
                    ? "Minimal 10 karakter"
                    : "Kata sandi akunmu"
                }
              />
            </label>
            {authMode === "register" && (
              <label className="field-label">
                Lagu profil (opsional)
                <input
                  type="url"
                  value={authMusicUrl}
                  onChange={(event) => setAuthMusicUrl(event.target.value)}
                  placeholder="https://music.youtube.com/watch?v=..."
                />
                <small>Tempel link satu lagu dari YouTube Music.</small>
              </label>
            )}
            {authError && (
              <p className="auth-error" role="alert">
                {authError}
              </p>
            )}
            <button
              className="save-button auth-submit"
              type="submit"
              disabled={authBusy}
            >
              {authBusy
                ? "Menghubungkan..."
                : authMode === "register"
                  ? "Buat akun"
                  : "Masuk"}
            </button>
          </form>
          <p className="auth-switch">
            {authMode === "register"
              ? "Sudah punya akun?"
              : "Belum punya akun?"}{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "register" ? "login" : "register");
                setAuthError("");
              }}
            >
              {authMode === "register" ? "Masuk" : "Daftar"}
            </button>
          </p>
        </section>
      </main>
    );
  }

  if (!vaultKeys) {
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-labelledby="unlock-title">
          <a className="brand auth-brand" href="/" aria-label="Manuknest">
            <span className="brand-icon">
              <Feather size={18} />
            </span>
            <span>Manuknest</span>
          </a>
          <div className="auth-copy">
            <div className="eyebrow muted">ARSIP TERENKRIPSI</div>
            <h1 id="unlock-title">Buka arsipmu.</h1>
            <p>
              Masukkan kata sandi untuk membuka link yang tersimpan di perangkat
              ini.
            </p>
          </div>
          <form className="auth-form" onSubmit={unlockVault}>
            <label className="field-label">
              Kata sandi akun
              <input
                type="password"
                autoComplete="current-password"
                required
                maxLength={72}
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Kata sandi akunmu"
              />
            </label>
            {authError && (
              <p className="auth-error" role="alert">
                {authError}
              </p>
            )}
            <button
              className="save-button auth-submit"
              type="submit"
              disabled={authBusy}
            >
              {authBusy ? "Membuka arsip..." : "Buka arsip"}
            </button>
          </form>
          <p className="auth-switch">
            Akun: <strong>{session.user.email}</strong>{" "}
            <button type="button" onClick={signOut}>
              Ganti akun
            </button>
          </p>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="auth-loading" role="status">
        Memuat link tersimpan...
      </main>
    );
  }

  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="topbar">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openHome();
            }}
          >
            <span className="brand-icon">
              <Feather size={18} />
            </span>
            <span>Manuknest</span>
          </a>
          <button
            className="sign-out-button"
            onClick={signOut}
            aria-label={`Keluar dari akun ${session.user.email}`}
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </header>

        <main>
          {isSharedProfileView ? (
            <SharedProfilePage
              username={sharedProfileUsername}
              token={session.token}
              onBack={openPopular}
            />
          ) : isProfileView ? (
            <section className="profile-page" aria-labelledby="profile-title">
              <header className="profile-hero">
                <div className="profile-avatar" aria-hidden="true">
                  {session.user.username[0]?.toUpperCase() ?? (
                    <UserRound size={34} />
                  )}
                </div>
                <h1 id="profile-title">
                  {session.user.username
                    ? `@${session.user.username}`
                    : "Atur username profil"}
                </h1>
                <button
                  className="profile-edit-button"
                  type="button"
                  onClick={editProfile}
                  aria-expanded={profileEditOpen}
                  aria-controls="profile-edit-form"
                >
                  <Pencil size={16} />
                  Edit profil
                </button>
              </header>
              {profileSaveNotice && (
                <p className="profile-feedback" role="status">
                  {profileSaveNotice}
                </p>
              )}
              {profileEditOpen && (
                <form
                  className="profile-edit-form"
                  id="profile-edit-form"
                  onSubmit={(event) => void saveProfile(event)}
                >
                  <h2>Edit profil</h2>
                  <label className="field-label">
                    Username
                    <input
                      type="text"
                      autoComplete="username"
                      required
                      minLength={3}
                      maxLength={24}
                      pattern="[A-Za-z0-9][A-Za-z0-9_]{2,23}"
                      value={profileEditUsername}
                      onChange={(event) =>
                        setProfileEditUsername(event.target.value)
                      }
                    />
                    <small>
                      Username harus unik. Gunakan 3-24 huruf, angka, atau garis
                      bawah.
                    </small>
                  </label>
                  <label className="field-label">
                    Lagu YouTube Music
                    <input
                      type="url"
                      value={profileEditMusicUrl}
                      onChange={(event) =>
                        setProfileEditMusicUrl(event.target.value)
                      }
                      placeholder="https://music.youtube.com/watch?v=..."
                    />
                    <small>
                      Opsional. Tempel link satu lagu; kosongkan untuk menghapus
                      pemutar musik.
                    </small>
                  </label>
                  {profileSaveError && (
                    <p className="auth-error" role="alert">
                      {profileSaveError}
                    </p>
                  )}
                  <div className="profile-edit-actions">
                    <button
                      className="profile-edit-button"
                      type="button"
                      onClick={() => {
                        setProfileEditOpen(false);
                        setProfileSaveError("");
                      }}
                    >
                      Batal
                    </button>
                    <button
                      className="save-button"
                      type="submit"
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Menyimpan..." : "Simpan profil"}
                    </button>
                  </div>
                </form>
              )}
              {profileLoading && (
                <div className="profile-state" role="status">
                  Memuat statistik profil...
                </div>
              )}
              {profileError && (
                <div className="profile-state error" role="alert">
                  <p>{profileError}</p>
                  <button
                    className="profile-edit-button"
                    type="button"
                    onClick={() => setProfileReload((current) => current + 1)}
                  >
                    Coba lagi
                  </button>
                </div>
              )}
              {profileStats && !profileError && (
                <dl className="profile-stats" aria-label="Statistik profil">
                  <div>
                    <dt>Dibagikan</dt>
                    <dd>{profileStats.sharedLinks}</dd>
                  </div>
                  <div>
                    <dt>Menyukai</dt>
                    <dd>{profileStats.likesGiven}</dd>
                  </div>
                  <div>
                    <dt>Disukai</dt>
                    <dd>{profileStats.likesReceived}</dd>
                  </div>
                </dl>
              )}
              <dl className="profile-details">
                <div>
                  <dt>Email</dt>
                  <dd>{session.user.email}</dd>
                </div>
                <div>
                  <dt>
                    <CalendarDays size={15} /> Bergabung
                  </dt>
                  <dd>{formatAccountDate(session.user.createdAt)}</dd>
                </div>
              </dl>
              <section className="profile-music" aria-labelledby="music-title">
                {session.user.musicVideoId ? (
                  <ProfileMusicPlayer videoId={session.user.musicVideoId} />
                ) : (
                  <p>
                    Belum ada lagu profil. Tambahkan satu link lagu YouTube
                    Music lewat Edit profil.
                  </p>
                )}
              </section>
            </section>
          ) : (
            <>
              {isHome && (
                <>
                  <section className="hero">
                    <div className="mascot-stage">
                      <Mascot
                        mood="happy"
                        savedCount={links.length}
                        speech={mascotSpeech}
                      />
                    </div>
                  </section>

                  <form
                    className="quick-save"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      openAdd(String(formData.get("url") ?? ""));
                    }}
                  >
                    <div className="quick-save-icon" aria-hidden="true">
                      <Plus size={18} />
                    </div>
                    <input
                      name="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="Tempel link yang ingin kamu simpan..."
                      aria-label="URL yang ingin disimpan"
                    />
                    <button className="save-button" type="submit">
                      Simpan
                    </button>
                  </form>
                </>
              )}
              {notice && (
                <div
                  className={noticeIsError ? "notice error" : "notice"}
                  role={noticeIsError ? "alert" : "status"}
                >
                  {noticeIsError ? <X size={15} /> : <Check size={15} />}
                  {notice}
                  <button onClick={() => showNotice("")} aria-label="Tutup">
                    <X size={14} />
                  </button>
                </div>
              )}
              {isHome && (
                <section className="stats-row">
                  <div className="stat-card">
                    <div className="stat-label">
                      TOTAL KOLEKSI <Bookmark size={15} />
                    </div>
                    <div className="stat-bottom">
                      <strong>{links.length}</strong>
                      <span>link tersimpan</span>
                      <div className="stat-art art-bookmark">
                        <Bookmark size={28} />
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">
                      KATEGORI <Folder size={15} />
                    </div>
                    <div className="stat-bottom">
                      <strong>
                        {new Set(links.map((l) => l.category)).size}
                      </strong>
                      <span>topik dijelajahi</span>
                      <div className="stat-art art-folder">
                        <Folder size={29} />
                      </div>
                    </div>
                  </div>
                  <div className="stat-card encouragement">
                    <div>
                      <span className="mini-label">PESAN DARI TIKO</span>
                      <p>Pelan-pelan aja. Ide bagus layak disimpan. 🌱</p>
                    </div>
                  </div>
                </section>
              )}

              <section className="collection">
                <div className="section-heading">
                  <div>
                    <h2>
                      <span className="hl">
                        {isSavedView
                          ? "Link tersimpan"
                          : isPopularView
                            ? "Explore"
                            : "Link terbaru"}
                      </span>
                    </h2>
                    {isPopularView && (
                      <p className="collection-description">
                        Jelajahi link yang dibagikan pengguna lain.
                      </p>
                    )}
                  </div>
                  {isHome && (
                    <button className="text-button" onClick={openArchive}>
                      Lihat semua
                    </button>
                  )}
                </div>
                {isSavedView && (
                  <>
                    <div className="collection-tools">
                      <label className="search-box">
                        <Search size={16} />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Cari sesuatu yang kamu simpan..."
                          aria-label="Cari link tersimpan"
                        />
                      </label>
                    </div>
                    {isSavedView && (
                      <div
                        className="filter-chips"
                        aria-label="Filter kategori"
                        onPointerDown={(event) => {
                          if (!event.isPrimary || event.button !== 0) return;
                          if (filterInertiaFrame.current !== null) {
                            cancelAnimationFrame(filterInertiaFrame.current);
                            filterInertiaFrame.current = null;
                          }
                          filterDrag.current = {
                            pointerId: event.pointerId,
                            startX: event.clientX,
                            startScrollLeft: event.currentTarget.scrollLeft,
                            lastX: event.clientX,
                            lastTime: event.timeStamp,
                            velocity: 0,
                            moved: false,
                          };
                        }}
                        onPointerMove={(event) => {
                          const drag = filterDrag.current;
                          if (!drag || drag.pointerId !== event.pointerId) {
                            return;
                          }
                          const distance = event.clientX - drag.startX;
                          if (!drag.moved && Math.abs(distance) > 6) {
                            drag.moved = true;
                            event.currentTarget.setPointerCapture(
                              event.pointerId,
                            );
                          }
                          if (!drag.moved) return;

                          const elapsed = Math.max(
                            event.timeStamp - drag.lastTime,
                            1,
                          );
                          drag.velocity =
                            -(event.clientX - drag.lastX) / elapsed;
                          drag.lastX = event.clientX;
                          drag.lastTime = event.timeStamp;
                          event.currentTarget.scrollLeft =
                            drag.startScrollLeft - distance;
                        }}
                        onPointerUp={(event) => {
                          const drag = filterDrag.current;
                          if (!drag || drag.pointerId !== event.pointerId) {
                            return;
                          }
                          filterDrag.current = null;
                          if (!drag.moved) return;

                          suppressFilterClick.current = true;
                          let velocity = Math.max(
                            -1.5,
                            Math.min(1.5, drag.velocity),
                          );
                          let previousTime = event.timeStamp;
                          const scrollElement = event.currentTarget;
                          const coast = (time: number) => {
                            const elapsed = Math.min(time - previousTime, 32);
                            previousTime = time;
                            scrollElement.scrollLeft += velocity * elapsed;
                            velocity *= Math.pow(0.94, elapsed / 16);
                            if (Math.abs(velocity) > 0.02) {
                              filterInertiaFrame.current =
                                requestAnimationFrame(coast);
                            } else {
                              filterInertiaFrame.current = null;
                            }
                          };
                          filterInertiaFrame.current =
                            requestAnimationFrame(coast);
                        }}
                        onPointerCancel={() => {
                          filterDrag.current = null;
                        }}
                        onClickCapture={(event) => {
                          if (!suppressFilterClick.current) return;
                          event.preventDefault();
                          event.stopPropagation();
                          suppressFilterClick.current = false;
                        }}
                      >
                        {filters.map((item) => (
                          <button
                            key={item}
                            className={
                              activeFilter === item ? "chip active" : "chip"
                            }
                            onClick={() => setActiveFilter(item)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="link-list">
                  {isPopularView && popularLoading && (
                    <div className="empty-state" role="status">
                      Memuat link Explore...
                    </div>
                  )}
                  {isPopularView && popularError && (
                    <div className="empty-state" role="alert">
                      <h3>Link Explore belum bisa dimuat.</h3>
                      <p>{popularError}</p>
                      <button
                        onClick={() =>
                          setReloadPopular((current) => current + 1)
                        }
                      >
                        Coba lagi
                      </button>
                    </div>
                  )}
                  {!isPopularView && loadError && (
                    <div className="empty-state" role="alert">
                      <h3>Link belum bisa dimuat.</h3>
                      <p>{loadError}</p>
                      <button
                        onClick={() => setReloadLinks((current) => current + 1)}
                      >
                        Coba lagi
                      </button>
                    </div>
                  )}
                  {isPopularView &&
                    !popularLoading &&
                    !popularError &&
                    popularLinks.length === 0 && (
                      <div className="empty-state">
                        <h3>Belum ada link yang dibagikan.</h3>
                        <p>
                          Link yang dibagikan akan muncul di sini. Pemiliknya
                          memilih untuk menampilkan URL dan judulnya.
                        </p>
                        <button onClick={openHome}>Kembali ke Home</button>
                      </div>
                    )}
                  {isPopularView &&
                    !popularLoading &&
                    !popularError &&
                    popularLinks.length > 0 && (
                      <CardStack
                        items={popularLinks.map((link) => ({
                          id: link.id,
                          tone: tones[link.id % tones.length],
                          icon: hostOf(link.url)[0]?.toUpperCase() ?? "?",
                          title: link.title,
                          subtitle: hostOf(link.url),
                          byline: link.username ? (
                            <>
                              Dibagikan oleh{" "}
                              <button
                                className="shared-author-link"
                                type="button"
                                onClick={() =>
                                  openSharedProfile(link.username)
                                }
                              >
                                @{link.username}
                              </button>
                            </>
                          ) : (
                            "Dibagikan oleh pengguna Manuknest"
                          ),
                          aside: (
                            <button
                              className={
                                link.likedByMe
                                  ? "popular-like liked"
                                  : "popular-like"
                              }
                              aria-label={
                                link.isOwner
                                  ? `Link milikmu, ${link.likeCount} suka`
                                  : link.likedByMe
                                    ? `Hapus sukamu, ${link.likeCount} suka`
                                    : `Sukai link, ${link.likeCount} suka`
                              }
                              aria-pressed={link.likedByMe}
                              disabled={
                                link.isOwner || likingPopularID === link.id
                              }
                              onClick={() => void togglePopularLike(link)}
                            >
                              <Heart
                                size={17}
                                fill={link.likedByMe ? "currentColor" : "none"}
                              />
                              <span>{link.likeCount}</span>
                            </button>
                          ),
                          body: (
                            <a
                              className="stack-url"
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {link.url}
                            </a>
                          ),
                          footer: (
                            <>
                              <span className="stack-pill">
                                {formatShortDate(link.createdAt)}
                              </span>
                              {link.isOwner && (
                                <span className="stack-pill soft">
                                  Link ini kamu bagikan
                                </span>
                              )}
                            </>
                          ),
                        }))}
                      />
                    )}
                  {!isPopularView && displayedLinks.length > 0 && (
                    <CardStack
                      items={displayedLinks.map((link) => ({
                        id: link.id,
                        tone: link.color,
                        icon: link.initials,
                        title: link.title,
                        subtitle: link.vault.description.trim(),
                        aside: (
                          <a
                            className="stack-round"
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Buka ${link.title}`}
                          >
                            <ExternalLink size={16} />
                          </a>
                        ),
                        body: (
                          <a
                            className="stack-url"
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {link.url}
                          </a>
                        ),
                        footer: (
                          <>
                            <span className="stack-pill">
                              {formatShortDate(link.createdAt)}
                            </span>
                            <span className="stack-pill soft">
                              {link.category}
                            </span>
                            {link.shared && (
                              <span className="stack-pill soft">Dibagikan</span>
                            )}
                            <div className="stack-actions">
                              <button
                                className="stack-round danger"
                                type="button"
                                aria-label={`Hapus ${link.title}`}
                                disabled={deletingLinkID !== null}
                                onClick={() => void deleteSavedLink(link)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </>
                        ),
                      }))}
                    />
                  )}
                  {isSavedView &&
                    displayedLinks.length === 0 &&
                    links.length > 0 &&
                    !loadError && (
                      <div className="empty-state">
                        <h3>Belum ketemu, nih.</h3>
                        <p>Coba kata kunci lain atau pilih kategori berbeda.</p>
                        <button
                          onClick={() => {
                            setQuery("");
                            setActiveFilter("Semua");
                          }}
                        >
                          Reset pencarian
                        </button>
                      </div>
                    )}
                  {!isPopularView && links.length === 0 && !loadError && (
                    <div className="empty-state">
                      <h3>
                        {isSavedView
                          ? "Belum ada link tersimpan."
                          : "Belum ada link terbaru."}
                      </h3>
                      <p>
                        Tempel URL, lalu pilih kategori dan tambahkan catatan
                        kalau perlu.
                      </p>
                      <button onClick={() => openAdd()}>
                        Simpan link pertama
                      </button>
                    </div>
                  )}
                  {isHome && links.length > 3 && (
                    <button
                      className="text-button recent-links-more"
                      onClick={() => openArchive()}
                    >
                      Buka semua {links.length} link
                    </button>
                  )}
                </div>
              </section>
              {isHome && (
                <section className="gentle-reminder">
                  <div className="reminder-star">✳</div>
                  <div>
                    <strong>Sarangnya link-link penting lo!</strong>
                    <p>Temukan lagi halaman yang kamu simpan kapan pun.</p>
                  </div>
                  <span className="reminder-plant">⌁</span>
                </section>
              )}
            </>
          )}
        </main>
        <nav className="bottom-nav" aria-label="Navigasi utama">
          {[
            { name: "Home", icon: House },
            { name: "Saved", icon: Bookmark },
            { name: "Explore", icon: Telescope },
            { name: "Profile", icon: UserRound },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={activeNav === name ? "nav-item active" : "nav-item"}
              aria-label={name}
              aria-current={activeNav === name ? "page" : undefined}
              onClick={() => {
                if (name === "Home") openHome();
                if (name === "Saved") openArchive();
                if (name === "Explore") openPopular();
                if (name === "Profile") openProfile();
              }}
            >
              <Icon size={17} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
      </div>
      {showAdd && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
        >
          <form
            className="add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-link-title"
            aria-describedby="add-link-description"
            onSubmit={(event) => {
              event.preventDefault();
              void saveLink();
            }}
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow muted">DETAIL LINK</span>
                <h2 id="add-link-title">Simpan link</h2>
                <p className="modal-description" id="add-link-description">
                  Judul, kategori, dan catatan disimpan di arsip pribadimu.
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setShowAdd(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>
            <label className="field-label">
              URL link
              <input
                autoFocus
                required
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setAddError("");
                }}
                placeholder="https://contoh.com"
              />
            </label>
            <label className="field-label">
              Judul link
              <input
                value={title}
                maxLength={500}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Kosongkan untuk memakai nama domain"
              />
            </label>
            <label className="field-label">
              Kategori
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {[
                  ...new Set([
                    ...categoryOptions,
                    ...links.map((link) => link.category),
                  ]),
                ].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Catatan kecil{" "}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Kenapa link ini menarik buat kamu?"
                rows={3}
              />
            </label>
            <div className="share-option">
              <label className="share-choice">
                <input
                  type="checkbox"
                  checked={sharePublic}
                  onChange={(event) => setSharePublic(event.target.checked)}
                />
                <span>
                  <strong>Bagikan di Explore</strong>
                  <small>
                    URL dan judul link bisa dilihat pengguna lain. Catatan,
                    kategori, dan status baca tetap privat.
                  </small>
                </span>
              </label>
            </div>
            {addError && (
              <p className="auth-error" role="alert">
                {addError}
              </p>
            )}
            <button
              className="save-button modal-save"
              type="submit"
              disabled={isSaving}
            >
              <Bookmark size={16} /> {isSaving ? "Menyimpan..." : "Simpan link"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
