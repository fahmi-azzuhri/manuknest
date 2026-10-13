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
  const [category, setCategory] = useState("Belajar");
  const [note, setNote] = useState("");
  const [activeNav, setActiveNav] = useState("Home");
  const [showFilters, setShowFilters] = useState(false);
  const filters = useMemo(
    () => ["Semua", ...new Set([...categoryOptions, ...links.map((link) => link.category)])],
    [links],
  );

  function showNotice(message: string, isError = false) {
    setNotice(message);
    setNoticeIsError(isError);
  }

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
  async function saveLink() {
    if (!session) return;
    const trimmed = url.trim();
    if (!trimmed) {
      showNotice("Tempel link dulu, ya.", true);
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(
        trimmed.includes("://") ? trimmed : `https://${trimmed}`,
      );
    } catch {
      showNotice("Format link belum valid. Coba periksa lagi.", true);
      return;
    }
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
      setSavedView(true);
      window.setTimeout(() => showNotice(""), 3000);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.sessionStorage.removeItem(sessionKey);
        setSession(null);
        setAuthError(error.message);
      } else {
        showNotice(error instanceof Error ? error.message : "Link belum bisa disimpan.", true);
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
              setActiveNav("Home");
              setSavedView(false);
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
          <section className="hero">
            <div className="mascot-stage">
              <Mascot
                mood="happy"
                savedCount={links.length}
                speech="Cuit! Ada link menarik? Simpan di sarang dulu, ya."
              />
            </div>
          </section>

          <section className="quick-save">
            <div className="quick-save-icon">
              <Plus size={18} />
            </div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void saveLink()}
              placeholder="Tempel link yang ingin kamu simpan..."
              aria-label="URL yang ingin disimpan"
            />
            <button className="save-button" onClick={saveLink} disabled={isSaving}>
              <Bookmark size={15} /> Simpan link
            </button>
          </section>
          {notice && (
            <div className={noticeIsError ? "notice error" : "notice"} role={noticeIsError ? "alert" : "status"}>
              {noticeIsError ? <X size={15} /> : <Check size={15} />}
              {notice}
              <button onClick={() => showNotice("")} aria-label="Tutup">
                <X size={14} />
              </button>
            </div>
          )}
          <section className="stats-row">
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
              <Mascot mood="peek" small />
            </div>
          </section>

          <section className="collection">
            <div className="section-heading">
              <div>
                <div className="eyebrow muted">PERPUSTAKAAN MINI</div>
                <h2>
                  {savedView ? "Link tersimpan" : "Koleksi kamu"}{" "}
                  <span className="count">{links.length}</span>
                </h2>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setSavedView(!savedView);
                  setActiveNav(savedView ? "Home" : "Saved");
                }}
              >
                {savedView ? "Lihat ringkasan" : "Lihat semua"}{" "}
                <ExternalLink size={14} />
              </button>
            </div>
            <div className="collection-tools">
              <label className="search-box">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari sesuatu yang kamu simpan..."
                />
              </label>
              <button
                className={`filter-button ${showFilters ? "selected" : ""}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={15} /> Filter <ChevronDown size={14} />
              </button>
            </div>
            {showFilters && (
              <div className="filter-chips">
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
            <div className="link-list">
              {loadError && (
                <div className="empty-state" role="alert">
                  <h3>Link belum bisa dimuat.</h3>
                  <p>{loadError}</p>
                  <button onClick={() => setReloadLinks((current) => current + 1)}>Coba lagi</button>
                </div>
              )}
              {visibleLinks.map((link, index) => (
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
              {visibleLinks.length === 0 && links.length > 0 && !loadError && (
                <div className="empty-state">
                  <Mascot mood="sleepy" small />
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
                  <Mascot mood="sleepy" small />
                  <h3>Sarangmu masih kosong.</h3>
                  <p>Simpan link pertama, nanti Tiko yang jaga.</p>
                  <button onClick={() => setShowAdd(true)}>Simpan link pertama</button>
                </div>
              )}
            </div>
          </section>
          <section className="gentle-reminder">
            <div className="reminder-star">✳</div>
            <div>
              <strong>Ruangmu, ritmemu.</strong>
              <p>Nggak perlu langsung rapi. Simpan dulu, bereskan nanti.</p>
            </div>
            <span className="reminder-plant">⌁</span>
          </section>
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
              onClick={() => {
                setActiveNav(name);
                if (name === "Saved") setSavedView(true);
                if (name === "Home") setSavedView(false);
                if (name === "Explore") {
                  setShowFilters(true);
                  setActiveFilter("Semua");
                }
                if (name === "Settings") showNotice(`Masuk sebagai ${session.user.email}.`);
              }}
            >
              <Icon size={17} />
              <span>{name}</span>
            </button>
          ))}
          <button
            className="nav-add"
            onClick={() => setShowAdd(true)}
            aria-label="Tambah link"
          >
            <Plus size={21} />
          </button>
        </nav>
      </div>
      {showAdd && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
        >
          <div className="add-modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow muted">TAMBAH KE KOLEKSI</span>
                <h2>Simpan sesuatu ✨</h2>
              </div>
              <button
                className="icon-button"
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
                value={url}
                onChange={(e) => setUrl(e.target.value)}
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
            <button className="save-button modal-save" onClick={saveLink} disabled={isSaving}>
              <Bookmark size={16} /> Simpan ke LinkNest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
