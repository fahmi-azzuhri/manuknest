import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { Search } from "lucide-react";
import { categoryOptions, tones } from "./components/app/types";
import type { AuthSession, SavedLink } from "./components/app/types";
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

const sessionKey = "tumpuk.session";

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

export default function App() {
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
        onSignOut={signOut}
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
          onHome={openHome}
          onSignOut={signOut}
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
          category={category}
          note={note}
          sharePublic={sharePublic}
          error={addError}
          isSaving={isSaving}
          categories={[
            ...new Set([
              ...categoryOptions,
              ...links.map((link) => link.category),
            ]),
          ]}
          onUrlChange={setUrl}
          onTitleChange={setTitle}
          onCategoryChange={setCategory}
          onNoteChange={setNote}
          onShareChange={setSharePublic}
          onClose={() => setShowAdd(false)}
          onSubmit={() => void saveLink()}
          onClearError={() => setAddError("")}
        />
      )}
    </div>
  );
}
