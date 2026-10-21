import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import SharedProfilePage from "./components/SharedProfilePage";
import AddLinkDialog from "./components/app/AddLinkDialog";
import AppHeader from "./components/app/AppHeader";
import {
  AuthScreen,
  AppLoadingScreen,
} from "./components/app/AuthScreen";
import BottomNavigation from "./components/app/BottomNavigation";
import type { AppNavigationItem } from "./components/app/BottomNavigation";
import CategoryFilters from "./components/app/CategoryFilters";
import HomeDashboard, { HomeReminder } from "./components/app/HomeDashboard";
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
import { isAdultContentLink, suggestSmartTags } from "./lib/tagging";
import {
  decryptLink,
  encryptLink,
  normalizeAndHashURL,
  type LinkVaultData,
} from "./lib/vault";
import {
  initialLocale,
  getTranslations,
  localizeMessage,
  localeStorageKey,
  type Locale,
} from "./lib/i18n";

const sessionKey = "tumpuk.session";

type AuthResponse = AuthSession;
type Theme = "light" | "dark";
type ThemeTransition = {
  theme: Theme;
};

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
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const copy = getTranslations(locale);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [themeTransition, setThemeTransition] =
    useState<ThemeTransition | null>(null);
  const [session, setSession] = useState<AuthSession | null>(readSession);
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [dataStatus, setDataStatus] = useState("");
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
  const [metadataAdultContent, setMetadataAdultContent] = useState(false);
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

  const localizedMascotSpeech =
    links.length >= 3
      ? copy.mascotChirp
      : links.length === 0
      ? copy.mascotHatchHint
      : copy.mascotHatchCount(3 - links.length);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(localeStorageKey, locale);
  }, [locale]);

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
              ? copy.notificationStatusError(
                  localizeMessage(error.message, locale),
                )
              : copy.statusNotificationUnreadable,
            true,
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, [locale]);

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
                  locale,
                )
              : cancelReminderNotification(link.id),
          ),
        );
      } catch (error) {
        if (active) {
          showNotice(
            error instanceof Error
              ? copy.reminderScheduleError(
                  localizeMessage(error.message, locale),
                )
              : copy.reminderScheduleError(""),
            true,
          );
        }
      }
    }
    void syncReminderNotifications();
    return () => {
      active = false;
    };
  }, [links, locale]);

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
    if (!session) {
      setLinks([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    const token = session.token;
    setIsLoading(true);
    setLoadError("");
    async function loadLinks() {
      try {
        await request<User>("/api/me", { token });
        const savedLinks = await request<LinkItem[]>("/api/links", { token });
        const decodedLinks: SavedLink[] = [];
        for (const savedLink of savedLinks) {
          if (savedLink.ciphertext) {
            const vault = await decryptLink(savedLink.ciphertext);
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
          if (!legacy) throw new Error(copy.legacyLinkIncomplete);
          const normalized = await normalizeAndHashURL(legacy.url);
          const vault: LinkVaultData = {
            url: normalized.url,
            title: legacy.title || normalized.domain,
            description: legacy.description || "",
            domain: normalized.domain,
            faviconUrl: legacy.faviconUrl || "",
            previewImageUrl: "",
            readStatus: legacy.readStatus === "done" ? "done" : "unread",
            metadataStatus: legacy.metadataStatus || "unavailable",
            tags: legacy.tags.map((tag) => tag.name),
            collections: legacy.collections.map(
              (collection) => collection.name,
            ),
          };
          const ciphertext = await encryptLink(vault);
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
            error instanceof Error ? error.message : copy.linkLoadFailed,
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
  }, [session, reloadLinks]);

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
          error instanceof Error ? error.message : copy.exploreLoadFailed,
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
          error instanceof Error ? error.message : copy.profileLoadFailed,
        );
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.token, activeNav, profileReload]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const result = await request<AuthResponse>(
        authMode === "register" ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          body:
            authMode === "register"
              ? {
                  email: authEmail,
                  password: authPassword,
                  username: authUsername,
                  musicUrl: authMusicUrl,
                }
              : { email: authEmail, password: authPassword },
        },
      );
      window.sessionStorage.setItem(sessionKey, JSON.stringify(result));
      setSession(result);
      setAuthUsername("");
      setAuthMusicUrl("");
      setAuthPassword("");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : copy.accountOpenFailed,
      );
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    try {
      await cancelAllReminderNotifications();
    } catch (error) {
      console.error("Could not cancel reminders before signing out.", error);
    }
    window.sessionStorage.removeItem(sessionKey);
    setSession(null);
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
                  locale,
                )
              : Promise.resolve(),
          ),
        );
        showNotice(copy.notificationAllowed);
      } else if (permission === "unsupported") {
        showNotice(copy.notificationsUnavailable);
      } else {
        showNotice(copy.notificationsInactive);
      }
    } catch (error) {
      showNotice(
        error instanceof Error
          ? copy.notificationEnableError(localizeMessage(error.message, locale))
          : copy.notificationEnableError(""),
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
  const isAdultContentBlocked =
    metadataAdultContent || isAdultContentLink(url, title);
  useEffect(() => {
    if (isAdultContentBlocked) setSharePublic(false);
  }, [isAdultContentBlocked]);

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

  async function refreshSmartTags(
    nextUrl = url,
    nextTitle = title,
    nextNote = note,
  ) {
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
    if (!rawURL || !session) {
      setMetadataLoading(false);
      return;
    }

    setMetadataLoading(true);
    setMetadataError("");
    setMetadataAdultContent(false);
    try {
      const normalized = await normalizeAndHashURL(rawURL);
      const metadata = await request<LinkMetadata>("/api/links/metadata", {
        method: "POST",
        token: session.token,
        body: { url: normalized.url },
      });
      if (requestID !== metadataRequestID.current) return;

      metadataCache.current = { url: normalized.url, metadata };
      setMetadataAdultContent(metadata.isAdultContent);
      const pageTitle = metadata.title.trim();
      if (!pageTitle) {
        setMetadataError(copy.invalidPageTitle);
        return;
      }
      if (metadata.source === "url") {
        setMetadataError(copy.metadataTitleRestricted);
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
          ? copy.metadataApiOutdated
          : copy.metadataUnavailable,
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
    setMetadataAdultContent(false);
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
    setMetadataAdultContent(false);
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
      setProfileSaveNotice(copy.profileUpdated);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.sessionStorage.removeItem(sessionKey);
        setSession(null);
        setAuthError(error.message);
      }
      setProfileSaveError(
        error instanceof Error ? error.message : copy.profileNotSaved,
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
          error instanceof Error ? error.message : copy.likeUpdateFailed,
          true,
        );
      }
    } finally {
      setLikingPopularID(null);
    }
  }

  function exportBookmarks() {
    const blob = new Blob([JSON.stringify(links.map((link) => link.vault), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tumpuk-bookmarks.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setDataStatus(copy.bookmarksExported);
  }

  async function importBookmarks(file: File) {
    if (!session) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error("Invalid JSON");
      const known = new Set(links.map((link) => link.urlHash));
      let added = 0;
      let skipped = 0;
      let invalid = 0;
      for (const item of parsed) {
        if (!item || typeof item !== "object" || !("url" in item) || typeof item.url !== "string") { invalid++; continue; }
        let normalized: Awaited<ReturnType<typeof normalizeAndHashURL>>;
        try { normalized = await normalizeAndHashURL(item.url); } catch { invalid++; continue; }
        if (known.has(normalized.urlHash)) { skipped++; continue; }
        const data = item as Partial<LinkVaultData>;
        const vault: LinkVaultData = {
          url: normalized.url,
          title: typeof data.title === "string" ? data.title : normalized.domain,
          description: typeof data.description === "string" ? data.description : "",
          domain: normalized.domain,
          faviconUrl: typeof data.faviconUrl === "string" ? data.faviconUrl : "",
          previewImageUrl: typeof data.previewImageUrl === "string" ? data.previewImageUrl : "",
          readStatus: data.readStatus === "done" ? "done" : "unread",
          ...(typeof data.reminderAt === "string" && Number.isFinite(Date.parse(data.reminderAt)) ? { reminderAt: data.reminderAt } : {}),
          metadataStatus: data.metadataStatus === "ready" || data.metadataStatus === "pending" ? data.metadataStatus : "unavailable",
          tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === "string") : [],
          collections: Array.isArray(data.collections) ? data.collections.filter((collection): collection is string => typeof collection === "string") : [],
        };
        const result = await request<{ link: LinkItem }>("/api/links", { method: "POST", token: session.token, body: { urlHash: normalized.urlHash, ciphertext: await encryptLink(vault) } });
        known.add(normalized.urlHash);
        added++;
        setLinks((current) => [toSavedLink(result.link.id, normalized.urlHash, vault, result.link.createdAt, result.link.shared), ...current]);
      }
      setDataStatus(copy.bookmarksImported(added, skipped, invalid));
    } catch { setDataStatus(copy.bookmarkImportFailed); }
  }

  async function saveLink() {
    if (!session) return;
    const trimmed = url.trim();
    if (!trimmed) {
      setAddError(copy.pasteLinkError);
      return;
    }
    let normalized: Awaited<ReturnType<typeof normalizeAndHashURL>>;
    try {
      normalized = await normalizeAndHashURL(trimmed);
    } catch {
      setAddError(copy.invalidLinkError);
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
      const adultContentBlocked =
        metadata?.isAdultContent === true ||
        isAdultContentLink(normalized.url, savedTitle);
      const shouldShare = sharePublic && !adultContentBlocked;
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

      if (shouldShare && new TextEncoder().encode(savedTitle).length > 500) {
        setAddError(copy.sharedTitleTooLong);
        return;
      }
      const vault: LinkVaultData = {
        url: normalized.url,
        title: savedTitle,
        description: note.trim(),
        domain: normalized.domain,
        faviconUrl: metadata?.faviconUrl ?? "",
        previewImageUrl: metadata?.previewImageUrl ?? "",
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
      const ciphertext = await encryptLink(vault);
      const result = await request<{
        link: LinkItem;
        shareBlocked?: boolean;
      }>("/api/links", {
        method: "POST",
        token: session.token,
        body: {
          urlHash: normalized.urlHash,
          ciphertext,
          ...(shouldShare
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
      const saveNotice =
        result.shareBlocked || adultContentBlocked
          ? copy.adultPrivate
          : metadataFailed
          ? metadata?.source === "url"
            ? copy.metadataTitleUnreadable
            : metadataUnavailableStatus === 405
            ? copy.metadataApiUpdate
            : customTitle
            ? copy.metadataCustomTitleFallback
            : copy.metadataDomainFallback
          : customTitle || pageTitle
          ? result.link.shared
            ? copy.savedAndShared
            : copy.savedWithTiko
          : copy.missingTitleFallback;
      showNotice(
        tagSuggestionsFailed
          ? `${saveNotice} ${copy.localTagSuggestions}`
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
          error instanceof Error ? error.message : copy.saveLinkFailed,
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
    if (!session) return;
    try {
      const ciphertext = await encryptLink(vault);
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
          error instanceof Error ? error.message : copy.changesNotSaved,
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
      status === "done" ? copy.completedLink : copy.readingStatusUpdated,
    );
  }

  function snoozeReminder(link: SavedLink) {
    if (!link.vault.reminderAt || link.vault.readStatus === "done") return;
    const vault = {
      ...link.vault,
      reminderAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    void updateSavedLink(link, vault, copy.reminderPostponed);
  }

  async function deleteSavedLink(link: SavedLink) {
    if (!session || deletingLinkID !== null) return;
    if (!window.confirm(copy.confirmDeleteLink(link.title))) {
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
            ? copy.deletedButNotificationFailed(
                localizeMessage(error.message, locale),
              )
            : copy.linkDeleteNotificationError,
          true,
        );
        return;
      }
      showNotice(copy.deleteLinkNotice(link.title));
      window.setTimeout(() => showNotice(""), 3000);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.sessionStorage.removeItem(sessionKey);
        setSession(null);
        setAuthError(error.message);
      } else {
        showNotice(
          error instanceof Error ? error.message : copy.linkNotDeleted,
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
        locale={locale}
        onLocaleChange={setLocale}
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

  if (isLoading) {
    return <AppLoadingScreen locale={locale} />;
  }

  return (
    <div className="app-root">
      <div className="app-shell">
        <AppHeader
          locale={locale}
          onLocaleChange={setLocale}
          email={session.user.email}
          theme={theme}
          onHome={openHome}
          onToggleTheme={toggleTheme}
          onSignOut={() => void signOut()}
        />

        <main>
          {isSharedProfileView ? (
            <SharedProfilePage
              locale={locale}
              username={sharedProfileUsername}
              token={session.token}
              onBack={openPopular}
            />
          ) : isProfileView ? (
            <ProfilePage
              locale={locale}
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
              dataStatus={dataStatus}
              onExportData={exportBookmarks}
              onImportData={(file) => void importBookmarks(file)}
            />
          ) : (
            <>
              {isHome && (
                <HomeDashboard
                  locale={locale}
                  links={links}
                  url={url}
                  mascotSpeech={localizedMascotSpeech}
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
                  locale={locale}
                />
              )}
              {!isPopularView && (
                <ReadingReminders
                  locale={locale}
                  links={dueReminders}
                  onSnooze={snoozeReminder}
                  onMarkFinished={(link) => updateReadingStatus(link, "done")}
                />
              )}

              <section className="collection">
                <div className="section-heading">
                  <div>
                    <h2>
                      <span className="hl">
                        {isSavedView
                          ? copy.saved
                          : isPopularView
                          ? copy.explore
                          : copy.latestLinks}
                      </span>
                    </h2>
                    {isPopularView && (
                      <p className="collection-description">
                        {copy.exploreDescription}
                      </p>
                    )}
                  </div>
                  {isHome && (
                    <button className="text-button" onClick={openArchive}>
                      {copy.viewAll}
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
                          placeholder={copy.searchSavedPlaceholder}
                          aria-label={copy.searchSavedLabel}
                        />
                      </label>
                    </div>
                    <CategoryFilters
                      locale={locale}
                      categories={filters}
                      activeCategory={activeFilter}
                      onCategoryChange={setActiveFilter}
                    />
                  </>
                )}
                <LinkList
                  locale={locale}
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
                  onRetryLinks={() => setReloadLinks((current) => current + 1)}
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
              {isHome && <HomeReminder locale={locale} />}
            </>
          )}
        </main>
        <BottomNavigation
          locale={locale}
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
          locale={locale}
          url={url}
          title={title}
          note={note}
          sharePublic={sharePublic}
          isAdultContentBlocked={isAdultContentBlocked}
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
