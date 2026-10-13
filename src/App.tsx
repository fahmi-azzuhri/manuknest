import { useMemo, useState } from "react";
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
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import Mascot from "./components/Mascot";

type SavedLink = {
  id: number;
  title: string;
  url: string;
  category: string;
  note: string;
  color: string;
  initials: string;
};
const initialLinks: SavedLink[] = [
  {
    id: 1,
    title: "Designing better empty states",
    url: "uxplanet.org/empty-states",
    category: "Desain",
    note: "Referensi buat microcopy dan onboarding.",
    color: "#e5d9be",
    initials: "U",
  },
  {
    id: 2,
    title: "Build a tiny search engine",
    url: "dev.to/build-search",
    category: "Belajar",
    note: "Coba implementasi saat weekend.",
    color: "#dce7d4",
    initials: "D",
  },
  {
    id: 3,
    title: "A collection of tiny tools",
    url: "tinywow.com/tools",
    category: "Tools",
    note: "Tools yang mungkin kepakai buat project.",
    color: "#dce4ec",
    initials: "T",
  },
];
const filters = ["Semua", "Belajar", "Desain", "Tools"];
export default function App() {
  const [links, setLinks] = useState(initialLinks);
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [savedView, setSavedView] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [category, setCategory] = useState("Belajar");
  const [note, setNote] = useState("");
  const [activeNav, setActiveNav] = useState("Home");
  const [showFilters, setShowFilters] = useState(false);
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
  function saveLink() {
    const trimmed = url.trim();
    if (!trimmed) {
      setNotice("Tempel link dulu, ya.");
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(
        trimmed.includes("://") ? trimmed : `https://${trimmed}`,
      );
    } catch {
      setNotice("Format link belum valid. Coba periksa lagi.");
      return;
    }
    const host = parsed.hostname.replace(/^www\./, "");
    setLinks((current) => [
      {
        id: Date.now(),
        title: host
          .split(".")[0]
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        url: host + parsed.pathname,
        category,
        note: note || "Belum ada catatan. Tambahkan nanti kalau perlu.",
        color: "#e4e8d8",
        initials: host[0].toUpperCase(),
      },
      ...current,
    ]);
    setUrl("");
    setNote("");
    setShowAdd(false);
    setNotice("Link berhasil disimpan. Tiko ikut senang!");
    setSavedView(true);
    window.setTimeout(() => setNotice(""), 3000);
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
              onKeyDown={(e) => e.key === "Enter" && saveLink()}
              placeholder="Tempel link yang ingin kamu simpan..."
              aria-label="URL yang ingin disimpan"
            />
            <button className="save-button" onClick={saveLink}>
              <Bookmark size={15} /> Simpan link
            </button>
          </section>
          {notice && (
            <div className="notice">
              <Check size={15} />
              {notice}
              <button onClick={() => setNotice("")} aria-label="Tutup">
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
                <strong>0{new Set(links.map((l) => l.category)).size}</strong>
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
                    href={
                      link.url.startsWith("http")
                        ? link.url
                        : `https://${link.url}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Buka ${link.title}`}
                  >
                    <ExternalLink size={16} />
                  </a>
                </article>
              ))}
              {visibleLinks.length === 0 && (
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
                if (name === "Settings")
                  setNotice(
                    "Pengaturan akun akan tersedia setelah backend ditambahkan.",
                  );
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
                {filters.slice(1).map((f) => (
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
            <button className="save-button modal-save" onClick={saveLink}>
              <Bookmark size={16} /> Simpan ke LinkNest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
