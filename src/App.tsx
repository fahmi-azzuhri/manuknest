import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Compass,
  ExternalLink,
  Filter,
  Folder,
  House,
  Feather,
  LogOut,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import Mascot from "./components/Mascot";
import { ApiError, request, type LinkItem, type User } from "./lib/api";

type SavedLink = {
  id: number;
  title: string;
  url: string;
  href: string;
  category: string;
  note: string;
  color: string;
  initials: string;
};
const sessionKey = "tumpuk.session";
const categoryOptions = ["Belajar", "Desain", "Tools"];

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
      return { token: value.token, user: { id: value.user.id, email: value.user.email } };
    }
  } catch {
    window.sessionStorage.removeItem(sessionKey);
    return null;
  }
  window.sessionStorage.removeItem(sessionKey);
  return null;
}

function toSavedLink(link: LinkItem): SavedLink {
  const parsed = new URL(link.url);
  return {
    id: link.id,
    title: link.title,
    url: `${link.domain}${parsed.pathname}${parsed.search}`,
    href: link.url,
    category: link.tags[0]?.name ?? "Belajar",
    note: link.description || "Belum ada catatan.",
    color: "#e4e8d8",
    initials: link.domain[0]?.toUpperCase() ?? "?",
  };
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(readSession);
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [loadError, setLoadError] = useState("");
  const [reloadLinks, setReloadLinks] = useState(0);
  const [isLoading, setIsLoading] = useState(() => session !== null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [savedView, setSavedView] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState("");
  const [category, setCategory] = useState("Belajar");
  const [note, setNote] = useState("");
  const [activeNav, setActiveNav] = useState("Home");
  const [showFilters, setShowFilters] = useState(false);
  const filters = useMemo(
    () => ["Semua", ...new Set([...categoryOptions, ...links.map((link) => link.category)])],
    [links],
  );
  const mascotSpeech =
    links.length >= 3
      ? "Cuit! Ada link menarik? Simpan dulu, ya."
      : links.length === 0
        ? "Simpan link pertama, yuk, biar telur ini menetas."
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
        if (active) {
          setLinks(savedLinks.map(toSavedLink));
          setLoadError("");
        }
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          window.sessionStorage.removeItem(sessionKey);
          setSession(null);
          setAuthError(error.message);
        } else {
          setLoadError(error instanceof Error ? error.message : "Link belum bisa dimuat.");
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

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const path = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const result = await request<AuthResponse>(path, {
        method: "POST",
        body: { email: authEmail, password: authPassword },
      });
      window.sessionStorage.setItem(sessionKey, JSON.stringify(result));
      setSession(result);
      setAuthPassword("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Akun belum bisa dibuka.");
    } finally {
      setAuthBusy(false);
    }
  }

  function signOut() {
    window.sessionStorage.removeItem(sessionKey);
    setSession(null);
    setLinks([]);
    setAuthError("");
    showNotice("");
    setLoadError("");
  }

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
  const displayedLinks = savedView ? visibleLinks : links.slice(0, 3);

  function openAdd(initialUrl = "") {
    setUrl(initialUrl);
    setAddError("");
    setShowAdd(true);
  }

  function openHome() {
    setSavedView(false);
    setActiveNav("Home");
    setQuery("");
    setActiveFilter("Semua");
    setShowFilters(false);
  }

  function openArchive(showFilters = false) {
    setSavedView(true);
    setActiveNav(showFilters ? "Explore" : "Saved");
    setQuery("");
    setActiveFilter("Semua");
    setShowFilters(showFilters);
  }

  async function saveLink() {
    if (!session) return;
    const trimmed = url.trim();
    if (!trimmed) {
      setAddError("Tempel link yang ingin kamu simpan.");
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(
        trimmed.includes("://") ? trimmed : `https://${trimmed}`,
      );
    } catch {
      setAddError("Format link belum valid. Coba periksa lagi.");
      return;
    }
    setAddError("");
    setIsSaving(true);
    try {
      const result = await request<{ link: LinkItem }>("/api/links", {
        method: "POST",
        token: session.token,
        body: {
          url: parsed.toString(),
          description: note,
          tagNames: [category],
        },
      });
      setLinks((current) => [toSavedLink(result.link), ...current]);
      setUrl("");
      setNote("");
      setShowAdd(false);
      showNotice("Link berhasil disimpan. Tiko ikut senang!");
      openArchive();
      window.setTimeout(() => showNotice(""), 3000);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.sessionStorage.removeItem(sessionKey);
        setSession(null);
        setAuthError(error.message);
      } else {
        setAddError(error instanceof Error ? error.message : "Link belum bisa disimpan.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (!session) {
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-labelledby="auth-title">
          <a className="brand auth-brand" href="/" aria-label="Manuknest">
            <span className="brand-icon"><Feather size={18} /></span>
            <span>Manuknest</span>
          </a>
          <div className="auth-copy">
            <div className="eyebrow muted">ARSIP TAUTAN PRIBADIMU</div>
            <h1 id="auth-title">{authMode === "register" ? "Buat sarangmu." : "Link-link pentingmu."}</h1>
            <p>{authMode === "register" ? "Daftar untuk mulai menyimpan halaman yang ingin kamu temukan lagi." : "Masuk untuk melanjutkan ke koleksi link yang kamu simpan."}</p>
          </div>
          <form className="auth-form" onSubmit={authenticate}>
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
                autoComplete={authMode === "register" ? "new-password" : "current-password"}
                required
                minLength={authMode === "register" ? 10 : undefined}
                maxLength={72}
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder={authMode === "register" ? "Minimal 10 karakter" : "Kata sandi akunmu"}
              />
            </label>
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            <button className="save-button auth-submit" type="submit" disabled={authBusy}>
              {authBusy ? "Menghubungkan..." : authMode === "register" ? "Buat akun" : "Masuk"}
            </button>
          </form>
          <p className="auth-switch">
            {authMode === "register" ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
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

  if (isLoading) {
    return <main className="auth-loading" role="status">Memuat link tersimpan...</main>;
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
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
          <button className="sign-out-button" onClick={signOut} aria-label={`Keluar dari akun ${session.user.email}`}>
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </header>

        <main>
          {!savedView && (
            <>
              <section className="hero">
                <div className="mascot-stage">
                  <Mascot mood="happy" savedCount={links.length} speech={mascotSpeech} />
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
                  Lanjutkan
                </button>
              </form>
            </>
          )}
          {notice && (
            <div className={noticeIsError ? "notice error" : "notice"} role={noticeIsError ? "alert" : "status"}>
              {noticeIsError ? <X size={15} /> : <Check size={15} />}
              {notice}
              <button onClick={() => showNotice("")} aria-label="Tutup">
                <X size={14} />
              </button>
            </div>
          )}
          {!savedView && <section className="stats-row">
            <div className="stat-card">
              <div className="stat-label">
                TOTAL KOLEKSI <Bookmark size={15} />
              </div>
              <div className="stat-bottom">
                <strong>{links.length.toString().padStart(2, "0")}</strong>
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
                <strong>{String(new Set(links.map((l) => l.category)).size).padStart(2, "0")}</strong>
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
          </section>}

          <section className="collection">
            <div className="section-heading">
              <div>
                <div className="eyebrow muted">{savedView ? "ARSIP LENGKAP" : "BARU DISIMPAN"}</div>
                <h2>
                  {savedView ? "Link tersimpan" : "Link terbaru"}{" "}
                  {savedView ? <span className="count">{links.length}</span> : links.length > 3 ? <span className="count">3</span> : null}
                </h2>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  if (savedView) openHome();
                  else openArchive();
                }}
              >
                {savedView ? "Kembali ke Home" : "Lihat semua"}{" "}
                <ExternalLink size={14} />
              </button>
            </div>
            {savedView && (
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
                  <button
                    className={`filter-button ${showFilters ? "selected" : ""}`}
                    onClick={() => setShowFilters(!showFilters)}
                    aria-expanded={showFilters}
                    aria-controls="saved-filters"
                  >
                    <Filter size={15} /> Filter <ChevronDown size={14} />
                  </button>
                </div>
                {showFilters && (
                  <div className="filter-chips" id="saved-filters">
                    {filters.map((item) => (
                      <button
                        key={item}
                        className={activeFilter === item ? "chip active" : "chip"}
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
              {loadError && (
                <div className="empty-state" role="alert">
                  <h3>Link belum bisa dimuat.</h3>
                  <p>{loadError}</p>
                  <button onClick={() => setReloadLinks((current) => current + 1)}>Coba lagi</button>
                </div>
              )}
              {displayedLinks.map((link) => (
                <article className="link-card" key={link.id}>
                  <div className="favicon" style={{ background: link.color }}>
                    {link.initials}
                  </div>
                  <div className="link-content">
                    <div className="link-title-row">
                      <h3>{link.title}</h3>
                      <span className="category-tag">{link.category}</span>
                    </div>
                    <div className="link-url">{link.url}</div>
                    <p>{link.note}</p>
                  </div>
                  <a
                    className="open-link"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Buka ${link.title}`}
                  >
                    <ExternalLink size={16} />
                  </a>
                </article>
              ))}
              {savedView && visibleLinks.length === 0 && links.length > 0 && !loadError && (
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
              {links.length === 0 && !loadError && (
                <div className="empty-state">
                  <h3>{savedView ? "Belum ada link tersimpan." : "Belum ada link terbaru."}</h3>
                  <p>Tempel URL, lalu pilih kategori dan tambahkan catatan kalau perlu.</p>
                  <button onClick={() => openAdd()}>Simpan link pertama</button>
                </div>
              )}
              {!savedView && links.length > 3 && (
                <button
                  className="text-button recent-links-more"
                  onClick={() => openArchive()}
                >
                  Buka semua {links.length} link
                </button>
              )}
            </div>
          </section>
          {!savedView && <section className="gentle-reminder">
            <div className="reminder-star">✳</div>
            <div>
              <strong>Biar linknya gampang dicari lagi.</strong>
              <p>Simpan link pentingmu, lalu cari lagi di Saved saat dibutuhkan.</p>
            </div>
            <span className="reminder-plant">⌁</span>
          </section>}
        </main>
        <nav className="bottom-nav" aria-label="Navigasi utama">
          {[
            { name: "Home", icon: House },
            { name: "Saved", icon: Bookmark },
            { name: "Explore", icon: Compass },
            { name: "Settings", icon: Settings2 },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={activeNav === name ? "nav-item active" : "nav-item"}
              aria-label={name}
              aria-current={activeNav === name ? "page" : undefined}
              onClick={() => {
                if (name === "Home") openHome();
                if (name === "Saved") openArchive();
                if (name === "Explore") openArchive(true);
                if (name === "Settings") setActiveNav(name);
                if (name === "Settings") showNotice(`Masuk sebagai ${session.user.email}.`);
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
                <p className="modal-description" id="add-link-description">URL, kategori, dan catatanmu tersimpan bersama.</p>
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
              Kategori
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {[...new Set([...categoryOptions, ...links.map((link) => link.category)])].map((f) => (
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
            {addError && <p className="auth-error" role="alert">{addError}</p>}
            <button className="save-button modal-save" type="submit" disabled={isSaving}>
              <Bookmark size={16} /> {isSaving ? "Menyimpan..." : "Simpan link"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
