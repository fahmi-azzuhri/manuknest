import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import SharedProfilePage from "./components/SharedProfilePage";
import AddLinkDialog from "./components/app/AddLinkDialog";
import AppHeader from "./components/app/AppHeader";
import {
  AuthScreen,
  AppLoadingScreen,
  VaultUnlockScreen,
} from "./components/app/AuthScreen";
import BottomNavigation from "./components/app/BottomNavigation";
import type { AppNavigationItem } from "./components/app/BottomNavigation";
import CategoryFilters from "./components/app/CategoryFilters";
import HomeDashboard, {
  HomeReminder,
} from "./components/app/HomeDashboard";
import LinkList from "./components/app/LinkList";
import Notice from "./components/app/Notice";
import ProfilePage from "./components/app/ProfilePage";
import ReadingReminders from "./components/app/ReadingReminders";
import { Search } from "lucide-react";
import ThemeTransitionOverlay from "./components/app/ThemeTransitionOverlay";
import { categoryOptions, tones } from "./components/app/types";
import type { AuthSession, SavedLink } from "./components/app/types";
import {
  ApiError,
  request,
  type LinkMetadata,
  type LinkItem,
  type PopularLink,
  type ProfileStats,
  type User,
} from "./lib/api";
import {
  cancelAllReminderNotifications,
  cancelReminderNotification,
  getReminderPermission,
  requestReminderPermission,
  scheduleReminderNotification,
  type ReminderPermission,
} from "./lib/reminders";
import { suggestSmartTags } from "./lib/tagging";
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

const sessionKey = "tumpuk.session";

type AuthResponse = AuthSession;
type Theme = "light" | "dark";
type ThemeTransition = {
  theme: Theme;
};

// Waktu (ms) tema benar-benar diganti: saat layar masih tertutup penuh
// oleh animasi, tepat di tengah pergantian matahari <-> bulan.
const THEME_SWAP_MS = 1150;

const themeStorageKey = "tumpuk.theme";

function initialTheme(): Theme {
  const stored = window.localStorage.getItem(themeStorageKey);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

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
  urlHash: string,
  vault: LinkVaultData,
  createdAt: string,
  shared = false,
): SavedLink {
  const parsed = new URL(vault.url);
  return {
    id,
    urlHash,
    title: vault.title || vault.domain,
    url: `${vault.domain}${parsed.pathname}${parsed.search}`,
    href: vault.url,
    category: vault.tags[0] ?? "Tutorial",
    note: vault.description || "Belum ada catatan.",
    color: tones[id % tones.length],
    initials: vault.domain[0]?.toUpperCase() ?? "?",
    vault,
    shared,
    createdAt,
  };
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [themeTransition, setThemeTransition] =
    useState<ThemeTransition | null>(null);
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
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reminderDays, setReminderDays] = useState(0);
  const [notificationPermission, setNotificationPermission] =
    useState<ReminderPermission>("unknown");
  const [smartTags, setSmartTags] = useState<string[]>(["Tutorial"]);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Tutorial"]);
  const [hasManualTagSelection, setHasManualTagSelection] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState("");
  const tagSuggestionRequestID = useRef(0);
  const tagSuggestionTimer = useRef<number | null>(null);
  const metadataRequestID = useRef(0);
  const metadataTimer = useRef<number | null>(null);
  const titleWasManuallyEdited = useRef(false);
  const autoTitle = useRef("");
  const metadataCache = useRef<{ url: string; metadata: LinkMetadata } | null>(
    null,
  );
  const [sharePublic, setSharePublic] = useState(false);
  const [activeNav, setActiveNav] = useState<AppNavigationItem>("Home");
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
  const [clock, setClock] = useState(Date.now());
  const filters = useMemo(
    () => [
      "Semua",
      ...new Set([...categoryOptions, ...links.map((link) => link.category)]),
    ],
    [links],
  );

  const mascotSpeech =
    links.length >= 3
      ? "Cuit! Ada link menarik? Simpan dulu, ya."
      : links.length === 0
        ? "Simpan sampai 3 link agar Tiko bisa menetas."
        : `Simpan ${3 - links.length} link lagi, yuk, biar telurnya menetas.`;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    void getReminderPermission().then(
      (permission) => {
        if (active) setNotificationPermission(permission);
      },
      (error: unknown) => {
        if (active) {
          setNotificationPermission("unsupported");
          showNotice(
            error instanceof Error
              ? `Status notifikasi tidak dapat dibaca: ${error.message}`
              : "Status notifikasi tidak dapat dibaca.",
            true,
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function syncReminderNotifications() {
      try {
        await Promise.all(
          links.map((link) =>
            link.vault.reminderAt && link.vault.readStatus !== "done"
              ? scheduleReminderNotification(
                  link.id,
                  link.vault.reminderAt,
                )
              : cancelReminderNotification(link.id),
          ),
        );
      } catch (error) {
        if (active) {
          showNotice(
            error instanceof Error
              ? `Notifikasi pengingat belum bisa dijadwalkan: ${error.message}`
              : "Notifikasi pengingat belum bisa dijadwalkan.",
            true,
          );
        }
      }
    }
    void syncReminderNotifications();
    return () => {
      active = false;
    };
  }, [links]);

  function showNotice(message: string, isError = false) {
    setNotice(message);
    setNoticeIsError(isError);
  }

  useEffect(() => {
    if (!showAdd) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeAdd();
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
                savedLink.urlHash,
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
            readStatus: legacy.readStatus === "done" ? "done" : "unread",
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
              normalized.urlHash,
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

  async function signOut() {
    try {
      await cancelAllReminderNotifications();
    } catch (error) {
      console.error(
        "Gagal membatalkan notifikasi pengingat sebelum keluar.",
        error,
      );
    }
    window.sessionStorage.removeItem(sessionKey);
    setSession(null);
    setVaultKeys(null);
    setLinks([]);
    setAuthError("");
    showNotice("");
    setLoadError("");
  }

  function applyTheme(next: Theme) {
    setTheme(next);
    window.localStorage.setItem(themeStorageKey, next);
  }

  function toggleTheme() {
    if (themeTransition) return;
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyTheme(nextTheme);
      return;
    }
    setThemeTransition({ theme: nextTheme });
  }

  useEffect(() => {
    if (!themeTransition) return;
    const timer = window.setTimeout(
      () => applyTheme(themeTransition.theme),
      THEME_SWAP_MS,
    );
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeTransition]);

  async function enableNotifications() {
    try {
      const permission = await requestReminderPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        await Promise.all(
          links.map((link) =>
            link.vault.reminderAt && link.vault.readStatus !== "done"
              ? scheduleReminderNotification(
                  link.id,
                  link.vault.reminderAt,
                )
              : Promise.resolve(),
          ),
        );
        showNotice("Notifikasi pengingat sudah diizinkan.");
      } else if (permission === "unsupported") {
        showNotice(
          "Notifikasi perangkat tidak tersedia. Pengingat tetap tampil di aplikasi.",
        );
      } else {
        showNotice(
          "Izin notifikasi belum aktif. Pengingat tetap tampil di aplikasi.",
        );
      }
    } catch (error) {
      showNotice(
        error instanceof Error
          ? `Izin notifikasi tidak dapat diaktifkan: ${error.message}`
          : "Izin notifikasi tidak dapat diaktifkan.",
        true,
      );
    }
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
  const dueReminders = links
    .filter(
      (link) =>
        link.vault.readStatus !== "done" &&
        link.vault.reminderAt &&
        Date.parse(link.vault.reminderAt) <= clock,
    )
    .sort(
      (left, right) =>
        Date.parse(left.vault.reminderAt ?? "") -
        Date.parse(right.vault.reminderAt ?? ""),
    );

  function applySmartTags(
    suggestions: string[],
    payload: { title: string; url: string; note: string },
  ) {
    let nextTags = suggestions;
    if (
      nextTags.length === 0 ||
      (nextTags.length === 1 && nextTags[0] === "Other")
    ) {
      const fallback = suggestSmartTags(payload);
      if (!(fallback.length === 1 && fallback[0] === "Other")) {
        nextTags = fallback;
      }
    }
    if (nextTags.length === 0) nextTags = ["Other"];
    setSmartTags(nextTags);
    setSelectedTags((current) => {
      const valid = current.filter((tag) => nextTags.includes(tag));
      return valid.length > 0 ? valid : nextTags.slice(0, 3);
    });
  }

  async function refreshSmartTags(nextUrl = url, nextTitle = title, nextNote = note) {
    const requestID = ++tagSuggestionRequestID.current;
    const payload = {
      title: nextTitle,
      url: nextUrl,
      note: nextNote,
    };
    if (!session) {
      applySmartTags(suggestSmartTags(payload), payload);
      return;
    }

    try {
      const suggestions = await request<string[]>("/api/tags/suggest", {
        method: "POST",
        token: session.token,
        body: payload,
      });
      if (requestID !== tagSuggestionRequestID.current) return;
      applySmartTags(suggestions, payload);
    } catch {
      if (requestID !== tagSuggestionRequestID.current) return;
      applySmartTags(suggestSmartTags(payload), payload);
    }
  }

  function scheduleSmartTagRefresh(
    nextUrl: string,
    nextTitle: string,
    nextNote: string,
  ) {
    tagSuggestionRequestID.current += 1;
    if (tagSuggestionTimer.current !== null) {
      window.clearTimeout(tagSuggestionTimer.current);
    }
    tagSuggestionTimer.current = window.setTimeout(() => {
      tagSuggestionTimer.current = null;
      void refreshSmartTags(nextUrl, nextTitle, nextNote);
    }, 450);
  }

  function cancelPendingMetadata() {
    metadataRequestID.current += 1;
    if (metadataTimer.current !== null) {
      window.clearTimeout(metadataTimer.current);
      metadataTimer.current = null;
    }
    setMetadataLoading(false);
  }

  async function loadLinkMetadata(nextUrl: string) {
    const requestID = ++metadataRequestID.current;
    const rawURL = nextUrl.trim();
    if (!rawURL || !vaultKeys || !session) {
      setMetadataLoading(false);
      return;
    }

    setMetadataLoading(true);
    setMetadataError("");
    try {
      const normalized = await normalizeAndHashURL(rawURL, vaultKeys);
      const metadata = await request<LinkMetadata>("/api/links/metadata", {
        method: "POST",
        token: session.token,
        body: { url: normalized.url },
      });
      if (requestID !== metadataRequestID.current) return;

      metadataCache.current = { url: normalized.url, metadata };
      const pageTitle = metadata.title.trim();
      if (!pageTitle) {
        setMetadataError("Judul halaman tidak ditemukan.");
        return;
      }
      if (metadata.source === "url") {
        setMetadataError("Judul halaman dibatasi. Judul dari alamat link dipakai.");
      }
      if (!titleWasManuallyEdited.current) {
        autoTitle.current = pageTitle;
        setTitle(pageTitle);
        scheduleSmartTagRefresh(rawURL, pageTitle, note);
      }
    } catch (error) {
      if (requestID !== metadataRequestID.current) return;
      setMetadataError(
        error instanceof ApiError && error.status === 405
          ? "API belum diperbarui untuk mengambil judul. Hubungi pengelola aplikasi."
          : "Judul halaman belum bisa diambil otomatis.",
      );
    } finally {
      if (requestID === metadataRequestID.current) {
        setMetadataLoading(false);
      }
    }
  }

  function scheduleLinkMetadataRefresh(nextUrl: string) {
    metadataRequestID.current += 1;
    if (metadataTimer.current !== null) {
      window.clearTimeout(metadataTimer.current);
    }
    metadataCache.current = null;
    setMetadataError("");
    setMetadataLoading(Boolean(nextUrl.trim()));
    metadataTimer.current = window.setTimeout(() => {
      metadataTimer.current = null;
      void loadLinkMetadata(nextUrl);
    }, 450);
  }

  function closeAdd() {
    tagSuggestionRequestID.current += 1;
    if (tagSuggestionTimer.current !== null) {
      window.clearTimeout(tagSuggestionTimer.current);
      tagSuggestionTimer.current = null;
    }
    cancelPendingMetadata();
    setShowAdd(false);
  }

  function toggleSmartTag(tag: string) {
    tagSuggestionRequestID.current += 1;
    if (tagSuggestionTimer.current !== null) {
      window.clearTimeout(tagSuggestionTimer.current);
      tagSuggestionTimer.current = null;
    }
    setHasManualTagSelection(true);
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...new Set([tag, ...current])],
    );
  }

  function openAdd(initialUrl = "") {
    tagSuggestionRequestID.current += 1;
    if (tagSuggestionTimer.current !== null) {
      window.clearTimeout(tagSuggestionTimer.current);
      tagSuggestionTimer.current = null;
    }
    cancelPendingMetadata();
    metadataCache.current = null;
    titleWasManuallyEdited.current = false;
    autoTitle.current = "";
    setUrl(initialUrl);
    setTitle("");
    setNote("");
    setReminderDays(0);
    setAddError("");
    setMetadataError("");
    setHasManualTagSelection(false);
    const suggestions = suggestSmartTags({ url: initialUrl });
    const nextTags = suggestions.length > 0 ? suggestions : ["Other"];
    setSmartTags(nextTags);
    setSelectedTags(nextTags.slice(0, 3));
    setShowAdd(true);
    if (initialUrl.trim()) {
      void loadLinkMetadata(initialUrl);
    }
    if (session && initialUrl.trim()) {
      void refreshSmartTags(initialUrl, "", "");
    }
  }

  function changeAddURL(value: string) {
    setUrl(value);
    setAddError("");
    if (!titleWasManuallyEdited.current && title === autoTitle.current) {
      autoTitle.current = "";
      setTitle("");
    }
    scheduleSmartTagRefresh(
      value,
      titleWasManuallyEdited.current ? title : "",
      note,
    );
    scheduleLinkMetadataRefresh(value);
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
    setAddError("");
    setIsSaving(true);
    tagSuggestionRequestID.current += 1;
    if (tagSuggestionTimer.current !== null) {
      window.clearTimeout(tagSuggestionTimer.current);
      tagSuggestionTimer.current = null;
    }
    try {
      let metadata: LinkMetadata | null = null;
      let metadataFailed = false;
      let metadataUnavailableStatus = 0;
      if (metadataCache.current?.url === normalized.url) {
        metadata = metadataCache.current.metadata;
        metadataFailed = metadata.source === "url";
      } else {
        try {
          metadata = await request<LinkMetadata>("/api/links/metadata", {
            method: "POST",
            token: session.token,
            body: { url: normalized.url },
          });
          metadataFailed = metadata.source === "url";
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) throw error;
          metadataFailed = true;
          metadataUnavailableStatus =
            error instanceof ApiError ? error.status : 0;
        }
      }

      const customTitle = title.trim();
      const pageTitle = metadata?.title.trim() ?? "";
      const savedTitle = customTitle || pageTitle || normalized.domain;
      const tagPayload = {
        title: savedTitle,
        url: normalized.url,
        note: note.trim(),
      };
      let finalTags = selectedTags;
      let tagSuggestionsFailed = false;
      if (!hasManualTagSelection) {
        try {
          finalTags = await request<string[]>("/api/tags/suggest", {
            method: "POST",
            token: session.token,
            body: tagPayload,
          });
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) throw error;
          tagSuggestionsFailed = true;
          finalTags = suggestSmartTags(tagPayload);
        }
        if (
          finalTags.length === 0 ||
          (finalTags.length === 1 && finalTags[0] === "Other")
        ) {
          finalTags = suggestSmartTags(tagPayload);
        }
        finalTags = finalTags.slice(0, 3);
      }
      if (finalTags.length === 0) finalTags = ["Other"];
      finalTags = [...new Set(finalTags)];
      setTitle(savedTitle);
      setSmartTags(finalTags);
      setSelectedTags(finalTags);

      if (sharePublic && new TextEncoder().encode(savedTitle).length > 500) {
        setAddError("Judul untuk link yang dibagikan terlalu panjang.");
        return;
      }
      const vault: LinkVaultData = {
        url: normalized.url,
        title: savedTitle,
        description: note.trim(),
        domain: normalized.domain,
        faviconUrl: metadata?.faviconUrl ?? "",
        readStatus: "unread",
        ...(reminderDays > 0
          ? {
              reminderAt: new Date(
                Date.now() + reminderDays * 24 * 60 * 60 * 1000,
              ).toISOString(),
            }
          : {}),
        metadataStatus: metadata?.source === "page" ? "ready" : "unavailable",
        tags: finalTags,
        collections: [],
      };
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
            ? {
                share: {
                  url: normalized.url,
                  title: vault.title,
                  tags: vault.tags,
                },
              }
            : {}),
        },
      });
      setLinks((current) => [
        toSavedLink(
          result.link.id,
          normalized.urlHash,
          vault,
          result.link.createdAt,
          result.link.shared,
        ),
        ...current,
      ]);
      setUrl("");
      setTitle("");
      setNote("");
      setReminderDays(0);
      metadataCache.current = null;
      titleWasManuallyEdited.current = false;
      autoTitle.current = "";
      setSharePublic(false);
      closeAdd();
      const saveNotice = metadataFailed
        ? metadata?.source === "url"
          ? "Judul halaman tidak dapat dibaca. Judul dari alamat link dipakai."
          : metadataUnavailableStatus === 405
            ? "API belum diperbarui untuk mengambil judul otomatis. Perbarui backend API agar fitur ini berfungsi."
            : customTitle
              ? "Metadata halaman tidak tersedia. Judul yang kamu isi tetap digunakan."
              : "Metadata halaman tidak tersedia. Nama domain dipakai. Link berhasil disimpan."
        : customTitle || pageTitle
          ? sharePublic
            ? "Link disimpan dan dibagikan di Explore."
            : "Link berhasil disimpan. Tiko ikut senang!"
          : "Judul halaman tidak ditemukan, nama domain dipakai. Link berhasil disimpan.";
      showNotice(
        tagSuggestionsFailed
          ? `${saveNotice} Saran tag lokal dipakai.`
          : saveNotice,
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

  async function updateSavedLink(
    link: SavedLink,
    vault: LinkVaultData,
    message: string,
  ) {
    if (!session || !vaultKeys) return;
    try {
      const ciphertext = await encryptLink(vault, link.urlHash, vaultKeys);
      await request<{ link: LinkItem }>(`/api/links/${link.id}`, {
        method: "PATCH",
        token: session.token,
        body: { urlHash: link.urlHash, ciphertext },
      });
      setLinks((current) =>
        current.map((item) =>
          item.id === link.id
            ? toSavedLink(
                link.id,
                link.urlHash,
                vault,
                link.createdAt,
                link.shared,
              )
            : item,
        ),
      );
      showNotice(message);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.sessionStorage.removeItem(sessionKey);
        setSession(null);
        setAuthError(error.message);
      } else {
        showNotice(
          error instanceof Error
            ? error.message
            : "Perubahan link belum bisa disimpan.",
          true,
        );
      }
    }
  }

  function updateReadingStatus(
    link: SavedLink,
    status: LinkVaultData["readStatus"],
  ) {
    const vault = { ...link.vault, readStatus: status };
    if (status === "done") delete vault.reminderAt;
    void updateSavedLink(
      link,
      vault,
      status === "done"
        ? "Link ditandai selesai. Pengingatnya dihapus."
        : "Status baca link diperbarui.",
    );
  }

  function snoozeReminder(link: SavedLink) {
    if (!link.vault.reminderAt || link.vault.readStatus === "done") return;
    const vault = {
      ...link.vault,
      reminderAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    void updateSavedLink(link, vault, "Pengingat ditunda 1 hari.");
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
      try {
        await cancelReminderNotification(link.id);
      } catch (error) {
        showNotice(
          error instanceof Error
            ? `Link dihapus, tetapi notifikasinya belum bisa dibatalkan: ${error.message}`
            : "Link dihapus, tetapi notifikasinya belum bisa dibatalkan.",
          true,
        );
        return;
      }
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
      <AuthScreen
        mode={authMode}
        busy={authBusy}
        error={authError}
        email={authEmail}
        password={authPassword}
        username={authUsername}
        musicUrl={authMusicUrl}
        onSubmit={authenticate}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onUsernameChange={setAuthUsername}
        onMusicUrlChange={setAuthMusicUrl}
        onToggleMode={() => {
          setAuthMode(authMode === "register" ? "login" : "register");
          setAuthError("");
        }}
      />
    );
  }

  if (!vaultKeys) {
    return (
      <VaultUnlockScreen
        email={session.user.email}
        password={authPassword}
        busy={authBusy}
        error={authError}
        onSubmit={unlockVault}
        onPasswordChange={setAuthPassword}
        onSignOut={() => void signOut()}
      />
    );
  }

  if (isLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <div className="app-root">
      <div className="app-shell">
        <AppHeader
          email={session.user.email}
          theme={theme}
          onHome={openHome}
          onToggleTheme={toggleTheme}
          onSignOut={() => void signOut()}
        />

        <main>
          {isSharedProfileView ? (
            <SharedProfilePage
              username={sharedProfileUsername}
              token={session.token}
              onBack={openPopular}
            />
          ) : isProfileView ? (
            <ProfilePage
              user={session.user}
              stats={profileStats}
              loading={profileLoading}
              error={profileError}
              reload={() => setProfileReload((current) => current + 1)}
              saveNotice={profileSaveNotice}
              editOpen={profileEditOpen}
              username={profileEditUsername}
              musicUrl={profileEditMusicUrl}
              saving={profileSaving}
              saveError={profileSaveError}
              onEdit={editProfile}
              onSubmit={(event) => void saveProfile(event)}
              onUsernameChange={setProfileEditUsername}
              onMusicUrlChange={setProfileEditMusicUrl}
              onCancelEdit={() => {
                setProfileEditOpen(false);
                setProfileSaveError("");
              }}
            />
          ) : (
            <>
              {isHome && (
                <HomeDashboard
                  links={links}
                  url={url}
                  mascotSpeech={mascotSpeech}
                  notice={notice}
                  noticeIsError={noticeIsError}
                  onUrlChange={setUrl}
                  onOpenAdd={openAdd}
                  onCloseNotice={() => showNotice("")}
                />
              )}
              {!isHome && notice && (
                <Notice
                  message={notice}
                  isError={noticeIsError}
                  onClose={() => showNotice("")}
                />
              )}
              {!isPopularView && (
                <ReadingReminders
                  links={dueReminders}
                  onSnooze={snoozeReminder}
                  onMarkFinished={(link) =>
                    updateReadingStatus(link, "done")
                  }
                />
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
                    <CategoryFilters
                      categories={filters}
                      activeCategory={activeFilter}
                      onCategoryChange={setActiveFilter}
                    />
                  </>
                )}
                <LinkList
                  isHome={isHome}
                  isSavedView={isSavedView}
                  isPopularView={isPopularView}
                  links={links}
                  displayedLinks={displayedLinks}
                  popularLinks={popularLinks}
                  popularLoading={popularLoading}
                  popularError={popularError}
                  loadError={loadError}
                  deletingLinkID={deletingLinkID}
                  likingPopularID={likingPopularID}
                  onRetryPopular={() =>
                    setReloadPopular((current) => current + 1)
                  }
                  onRetryLinks={() =>
                    setReloadLinks((current) => current + 1)
                  }
                  onOpenHome={openHome}
                  onOpenAdd={() => openAdd()}
                  onOpenArchive={openArchive}
                  onOpenSharedProfile={openSharedProfile}
                  onTogglePopularLike={(link) => void togglePopularLike(link)}
                  onReadingStatusChange={updateReadingStatus}
                  onSnoozeReminder={snoozeReminder}
                  onDeleteLink={(link) => void deleteSavedLink(link)}
                  onResetSearch={() => {
                    setQuery("");
                    setActiveFilter("Semua");
                  }}
                />
              </section>
              {isHome && <HomeReminder />}
            </>
          )}
        </main>
        <BottomNavigation
          activeItem={activeNav}
          onNavigate={(item) => {
            if (item === "Home") openHome();
            if (item === "Saved") openArchive();
            if (item === "Explore") openPopular();
            if (item === "Profile") openProfile();
          }}
        />
      </div>
      {showAdd && (
        <AddLinkDialog
          url={url}
          title={title}
          note={note}
          sharePublic={sharePublic}
          reminderDays={reminderDays}
          notificationPermission={notificationPermission}
          error={addError}
          isSaving={isSaving}
          metadataLoading={metadataLoading}
          metadataError={metadataError}
          smartTags={smartTags}
          selectedTags={selectedTags}
          onUrlChange={(value) => {
            changeAddURL(value);
          }}
          onTitleChange={(value) => {
            titleWasManuallyEdited.current = true;
            autoTitle.current = "";
            setTitle(value);
            scheduleSmartTagRefresh(url, value, note);
          }}
          onNoteChange={(value) => {
            setNote(value);
            scheduleSmartTagRefresh(url, title, value);
          }}
          onReminderDaysChange={setReminderDays}
          onRequestNotifications={() => void enableNotifications()}
          onShareChange={setSharePublic}
          onSmartTagToggle={toggleSmartTag}
          onClose={closeAdd}
          onSubmit={() => void saveLink()}
          onClearError={() => setAddError("")}
        />
      )}
      {themeTransition && (
        <ThemeTransitionOverlay
          to={themeTransition.theme}
          onDone={() => setThemeTransition(null)}
        />
      )}
    </div>
  );
}
