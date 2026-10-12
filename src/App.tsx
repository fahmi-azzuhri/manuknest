import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ApiError,
  request,
  type Collection,
  type LinkItem,
  type ReadStatus,
  type Tag,
  type User,
} from './lib/api'

type AuthResponse = {
  token: string
  user: User
}

type LinkResponse = {
  link: LinkItem
  warning?: string
}

const statusLabels: Record<ReadStatus, string> = {
  unread: 'Belum dibaca',
  reading: 'Sedang dibaca',
  done: 'Selesai',
}

const statusOrder: ReadStatus[] = ['unread', 'reading', 'done']

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('tumpuk-token') ?? '')
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [ready, setReady] = useState(!sessionStorage.getItem('tumpuk-token'))
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [links, setLinks] = useState<LinkItem[]>([])
  const [linksError, setLinksError] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReadStatus | ''>('')
  const [collectionFilter, setCollectionFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [formURL, setFormURL] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCollections, setFormCollections] = useState<number[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialog, setDialog] = useState<'collection' | 'edit' | null>(null)
  const [dialogError, setDialogError] = useState('')
  const [collectionName, setCollectionName] = useState('')
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editCollections, setEditCollections] = useState<number[]>([])
  const [editStatus, setEditStatus] = useState<ReadStatus>('unread')
  const [editSaving, setEditSaving] = useState(false)
  const [mascotMotion, setMascotMotion] = useState<'intro' | 'saved' | 'rest'>('intro')
  const dialogRef = useRef<HTMLDialogElement>(null)

  const loadLinks = useCallback(async (signal?: AbortSignal) => {
    if (!token) return
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (statusFilter) params.set('status', statusFilter)
    if (collectionFilter) params.set('collection', collectionFilter)
    if (tagFilter) params.set('tag', tagFilter)
    const suffix = params.size ? `?${params.toString()}` : ''
    const result = await request<LinkItem[]>(`/api/links${suffix}`, { token, signal })
    setLinks(result)
    setLinksError('')
  }, [collectionFilter, query, statusFilter, tagFilter, token])

  useEffect(() => {
    if (!dialog) return
    const element = dialogRef.current
    if (!element) return
    element.showModal()
    return () => {
      if (element.open) element.close()
    }
  }, [dialog])

  useEffect(() => {
    if (mascotMotion === 'rest') return
    const timeout = window.setTimeout(() => setMascotMotion('rest'), 850)
    return () => window.clearTimeout(timeout)
  }, [mascotMotion])

  useEffect(() => {
    if (!token) return
    let active = true
    Promise.all([
      request<User>('/api/me', { token }),
      request<Tag[]>('/api/tags', { token }),
      request<Collection[]>('/api/collections', { token }),
    ]).then(([profile, userTags, userCollections]) => {
      if (!active) return
      setUser(profile)
      setTags(userTags)
      setCollections(userCollections)
    }).catch((error: unknown) => {
      if (!active) return
      if (error instanceof ApiError && error.status === 401) {
        sessionStorage.removeItem('tumpuk-token')
        setToken('')
        return
      }
      setPageError(error instanceof Error ? error.message : 'Data akun belum bisa dimuat.')
    }).finally(() => {
      if (active) setReady(true)
    })
    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    if (!token || !ready || !user) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      setLoading(true)
      loadLinks(controller.signal).catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLinksError(error instanceof Error ? error.message : 'Link belum bisa dimuat.')
        }
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    }, 180)
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [loadLinks, ready, token, user])

  useEffect(() => {
    if (!links.some((link) => link.metadataStatus === 'pending')) return
    const timeout = window.setTimeout(() => {
      loadLinks().catch((error: unknown) => {
        setLinksError(error instanceof Error ? error.message : 'Status metadata belum bisa diperbarui.')
      })
    }, 2200)
    return () => window.clearTimeout(timeout)
  }, [links, loadLinks])

  const visibleHeading = useMemo(() => {
    if (collectionFilter) return collections.find((item) => `${item.id}` === collectionFilter)?.name ?? 'Koleksi'
    if (tagFilter) return tags.find((item) => `${item.id}` === tagFilter)?.name ?? 'Tag'
    if (statusFilter) return statusLabels[statusFilter]
    return 'Semua tautan'
  }, [collectionFilter, statusFilter, tagFilter, collections, tags])

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setAuthError('')
    const formData = new FormData(event.currentTarget)
    try {
      const result = await request<AuthResponse>(`/api/auth/${authMode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        body: {
          email: formData.get('email'),
          password: formData.get('password'),
        },
      })
      sessionStorage.setItem('tumpuk-token', result.token)
      setUser(result.user)
      setPageError('')
      setReady(false)
      setToken(result.token)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Akun belum bisa dibuka.')
    } finally {
      setLoading(false)
    }
  }

  async function submitLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setSaving(true)
    setPageError('')
    setNotice('')
    try {
      const result = await request<LinkResponse>('/api/links', {
        method: 'POST',
        token,
        body: {
          url: formURL,
          title: formTitle,
          description: formDescription,
          tagNames: formTags.split(',').map((item) => item.trim()).filter(Boolean),
          collectionIds: formCollections,
        },
      })
      setFormURL('')
      setFormTitle('')
      setFormDescription('')
      setFormTags('')
      setFormCollections([])
      setShowDetails(false)
      setMascotMotion('saved')
      setNotice(result.warning ?? 'Link sudah masuk ke tumpukanmu.')
      await Promise.all([
        loadLinks(),
        request<Tag[]>('/api/tags', { token }).then(setTags),
      ])
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Link belum bisa disimpan.')
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(link: LinkItem) {
    const nextStatus = statusOrder[(statusOrder.indexOf(link.readStatus) + 1) % statusOrder.length]
    try {
      await request<LinkItem>(`/api/links/${link.id}`, {
        method: 'PATCH',
        token,
        body: { readStatus: nextStatus },
      })
      await loadLinks()
      setNotice(`Status link diubah menjadi ${statusLabels[nextStatus].toLowerCase()}.`)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Status link belum bisa diubah.')
    }
  }

  function startEditing(link: LinkItem) {
    setDialogError('')
    setEditingLink(link)
    setEditTitle(link.title)
    setEditDescription(link.description)
    setEditTags(link.tags.map((tag) => tag.name).join(', '))
    setEditCollections(link.collections.map((collection) => collection.id))
    setEditStatus(link.readStatus)
    setDialog('edit')
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingLink) return
    setEditSaving(true)
    try {
      await request<LinkItem>(`/api/links/${editingLink.id}`, {
        method: 'PATCH',
        token,
        body: {
          title: editTitle,
          description: editDescription,
          tagNames: editTags.split(',').map((item) => item.trim()).filter(Boolean),
          collectionIds: editCollections,
          readStatus: editStatus,
        },
      })
      const [userTags, userCollections] = await Promise.all([
        request<Tag[]>('/api/tags', { token }),
        request<Collection[]>('/api/collections', { token }),
        loadLinks(),
      ])
      setTags(userTags)
      setCollections(userCollections)
      setDialog(null)
      setEditingLink(null)
      setNotice('Perubahan link sudah disimpan.')
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'Perubahan belum bisa disimpan.')
    } finally {
      setEditSaving(false)
    }
  }

  async function deleteLink(link: LinkItem) {
    if (!window.confirm(`Hapus "${link.title}" dari tumpukan?`)) return
    try {
      await request<void>(`/api/links/${link.id}`, { method: 'DELETE', token })
      setLinks((current) => current.filter((item) => item.id !== link.id))
      setNotice('Link sudah dihapus.')
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Link belum bisa dihapus.')
    }
  }

  async function createCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const collection = await request<Collection>('/api/collections', {
        method: 'POST',
        token,
        body: { name: collectionName },
      })
      setCollections((current) => [...current, collection].sort((a, b) => a.name.localeCompare(b.name)))
      setCollectionName('')
      setDialogError('')
      setDialog(null)
      setNotice(`Koleksi ${collection.name} dibuat.`)
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'Koleksi belum bisa dibuat.')
    }
  }

  function signOut() {
    sessionStorage.removeItem('tumpuk-token')
    setToken('')
    setReady(true)
    setUser(null)
    setLinks([])
    setLinksError('')
    setTags([])
    setCollections([])
    setPageError('')
    setNotice('')
    setLoading(false)
  }

  function resetFilters() {
    setQuery('')
    setStatusFilter('')
    setCollectionFilter('')
    setTagFilter('')
  }

  function setStatus(status: ReadStatus | '') {
    setStatusFilter(status)
    setCollectionFilter('')
    setTagFilter('')
  }

  if (!ready && token && !user) {
    return <div className="screen-message" role="status">Membuka arsip…</div>
  }

  if (!token || !user) {
    return (
      <main className="auth-screen">
        <div className="auth-paper">
          <a className="wordmark auth-wordmark" href="/" aria-label="Tumpuk, halaman awal">Tumpuk<span>.</span></a>
          <p className="eyebrow">Arsip link pribadi</p>
          <h1>{authMode === 'login' ? 'Temukan lagi yang pernah kamu simpan.' : 'Mulai tumpuk link pentingmu.'}</h1>
          <p className="auth-intro">Simpan tautan yang ingin kamu buka lagi. Kelompokkan seperlunya, cari saat dibutuhkan.</p>
          <form className="auth-form" onSubmit={submitAuth}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="nama@email.com" />
            <label htmlFor="password">Kata sandi</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={authMode === 'register' ? 10 : 1}
              maxLength={72}
              placeholder={authMode === 'register' ? 'Minimal 10 karakter' : 'Kata sandi kamu'}
            />
            {authError && <p className="form-error" role="alert">{authError}</p>}
            <button className="button button-primary auth-submit flex justify-center" type="submit" disabled={loading}>
              {loading ? 'Tunggu sebentar…' : authMode === 'login' ? 'Masuk ke arsip' : 'Buat akun'}
            </button>
          </form>
          <p className="auth-switch">
            {authMode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login')
                setAuthError('')
              }}
            >
              {authMode === 'login' ? 'Buat akun' : 'Masuk'}
            </button>
          </p>
        </div>
        <p className="auth-note">Satu tempat untuk link yang ingin kamu temukan lagi.</p>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navigasi arsip">
        <button className="wordmark" type="button" onClick={resetFilters}>Tumpuk<span>.</span></button>
        <p className="sidebar-caption">ARSIP PRIBADI</p>
        <nav className="primary-nav" aria-label="Status bacaan">
          <button className={!statusFilter && !collectionFilter && !tagFilter ? 'nav-item active' : 'nav-item'} type="button" onClick={resetFilters}>
            <span>Semua tautan</span>
          </button>
          {statusOrder.map((status) => (
            <button className={statusFilter === status ? 'nav-item active' : 'nav-item'} key={status} type="button" onClick={() => setStatus(status)}>
              <span>{statusLabels[status]}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-section">
          <div className="section-heading">
            <h2>Koleksi</h2>
            <button className="small-action" type="button" onClick={() => { setDialogError(''); setDialog('collection') }} aria-label="Buat koleksi">+</button>
          </div>
          {collections.length ? (
            <nav className="collection-nav" aria-label="Koleksi">
              {collections.map((collection) => (
                <button
                  className={collectionFilter === `${collection.id}` ? 'nav-item collection-item active' : 'nav-item collection-item'}
                  key={collection.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter('')
                    setTagFilter('')
                    setCollectionFilter(`${collection.id}`)
                  }}
                >
                  <span className="collection-mark" aria-hidden="true">/</span>
                  <span>{collection.name}</span>
                </button>
              ))}
            </nav>
          ) : (
            <p className="sidebar-empty">Belum ada koleksi.</p>
          )}
        </div>
        <div className="sidebar-footer">
          <span className="account-email">{user.email}</span>
          <button className="signout-button" type="button" onClick={signOut}>Keluar</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Tumpukanmu</p>
            <h1>{visibleHeading}</h1>
          </div>
          <button className="mobile-signout" type="button" onClick={signOut}>Keluar</button>
        </header>

        <section className="collection-shelf" aria-labelledby="collection-shelf-heading">
          <div className="shelf-heading">
            <h2 id="collection-shelf-heading">Koleksi</h2>
            <button className="small-action" type="button" onClick={() => { setDialogError(''); setDialog('collection') }} aria-label="Buat koleksi">+</button>
          </div>
          <div className="collection-cards">
            {collections.length ? collections.map((collection) => (
              <button
                className={collectionFilter === `${collection.id}` ? 'collection-card active' : 'collection-card'}
                key={collection.id}
                type="button"
                aria-pressed={collectionFilter === `${collection.id}`}
                onClick={() => {
                  setStatusFilter('')
                  setTagFilter('')
                  setCollectionFilter(collectionFilter === `${collection.id}` ? '' : `${collection.id}`)
                }}
              >
                <span className="collection-mark" aria-hidden="true">/</span>
                <span>{collection.name}</span>
              </button>
            )) : (
              <p className="shelf-empty">Buat koleksi kalau ingin mengelompokkan link.</p>
            )}
          </div>
        </section>

        <section className={`welcome-scene${mascotMotion === 'saved' ? ' has-saved' : mascotMotion === 'intro' ? ' is-entering' : ''}`} aria-labelledby="welcome-heading">
          <div className="mascot-stage" aria-hidden="true">
            <svg className="link-keeper" viewBox="0 0 240 190" role="presentation">
              <ellipse className="mascot-shadow" cx="120" cy="166" rx="82" ry="10" />
              <g className="mascot-pages">
                <path className="mascot-page page-back" d="M57 58 124 37l50 16-6 93-111-4z" />
                <path className="mascot-page page-front" d="m72 49 66-18 43 18-7 92-106-3z" />
                <path className="mascot-fold" d="m138 31-2 27 43-9z" />
                <path className="mascot-mark" d="m91 75 44-12m-42 26 52-14m-50 28 38-10" />
              </g>
              <g className="mascot-body">
                <path className="mascot-creature" d="M120 54c10-13 27-13 37-2 14-8 30 1 31 16 15 6 18 24 8 35 8 15-1 31-16 34-5 15-22 20-35 12-13 11-31 7-37-7-17 1-28-13-23-28-12-11-9-29 5-36 0-16 14-27 30-24Z" />
                <path className="mascot-face" d="M91 108c0-9 7-16 16-16h32c9 0 16 7 16 16v7c0 9-7 16-16 16h-32c-9 0-16-7-16-16z" />
                <ellipse className="mascot-eye" cx="108" cy="111" rx="4" ry="7" />
                <ellipse className="mascot-eye" cx="138" cy="111" rx="4" ry="7" />
                <path className="mascot-mouth" d="M116 126q7 5 14 0" />
                <path className="mascot-cheek" d="M81 119q6 4 11 0m58 0q5 4 11 0" />
              </g>
              <path className="mascot-spark" d="m48 101 3 8 8 3-8 3-3 8-3-8-8-3 8-3zm151 5 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
            </svg>
          </div>
          <div className="welcome-copy">
            <p className="eyebrow">Penjaga tumpukanmu</p>
            <h2 id="welcome-heading">Temuanmu punya tempat.</h2>
            <p>Simpan dulu, rapikan nanti. Link yang kamu temukan akan lebih mudah dicari lagi.</p>
          </div>
        </section>

        <form className="save-panel" onSubmit={submitLink}>
          <label htmlFor="save-url">Simpan link baru</label>
          <div className="save-row flex gap-2">
            <input
              id="save-url"
              type="url"
              value={formURL}
              onChange={(event) => setFormURL(event.target.value)}
              placeholder="Tempel link yang kamu temukan"
              required
              maxLength={2048}
              inputMode="url"
            />
            <button className="button button-primary save-button" type="submit" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Tumpuk link'}
            </button>
          </div>
          <button className="details-toggle" type="button" onClick={() => setShowDetails(!showDetails)} aria-expanded={showDetails}>
            {showDetails ? 'Sembunyikan detail' : 'Tambah detail'}
          </button>
          {showDetails && (
            <div className="save-details">
              <label>
                Judul pilihan
                <input value={formTitle} onChange={(event) => setFormTitle(event.target.value)} maxLength={500} placeholder="Diambil dari halaman jika kosong" />
              </label>
              <label>
                Catatan singkat
                <textarea value={formDescription} onChange={(event) => setFormDescription(event.target.value)} maxLength={4000} rows={2} placeholder="Deskripsi singkat, kalau perlu" />
              </label>
              <label>
                Tag, pisahkan dengan koma
                <input value={formTags} onChange={(event) => setFormTags(event.target.value)} placeholder="misalnya: belajar, referensi" />
              </label>
              {collections.length > 0 && (
                <fieldset className="collection-picker">
                  <legend>Simpan ke koleksi</legend>
                  {collections.map((collection) => (
                    <label className="checkbox-label" key={collection.id}>
                      <input
                        type="checkbox"
                        checked={formCollections.includes(collection.id)}
                        onChange={(event) => setFormCollections((current) => event.target.checked
                          ? [...current, collection.id]
                          : current.filter((id) => id !== collection.id))}
                      />
                      {collection.name}
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
          )}
        </form>

        {notice && <p className="notice" role="status">{notice}<button type="button" aria-label="Tutup pemberitahuan" onClick={() => setNotice('')}>Tutup</button></p>}
        {pageError && <div className="error-panel" role="alert"><p>{pageError}</p><button className="text-button" type="button" onClick={() => { setPageError(''); void loadLinks() }}>Coba lagi</button></div>}

        <section className="link-library" aria-labelledby="library-heading">
          <div className="library-toolbar flex gap-2">
            <div className="search-wrap">
              <label className="sr-only" htmlFor="search-links">Cari judul, URL, domain, deskripsi, atau tag</label>
              <input
                id="search-links"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari di seluruh tumpukan"
              />
            </div>
            <label className="filter-label">
              <span className="sr-only">Filter berdasarkan tag</span>
              <select
                value={tagFilter}
                onChange={(event) => {
                  setTagFilter(event.target.value)
                  setCollectionFilter('')
                  setStatusFilter('')
                }}
              >
                <option value="">Semua tag</option>
                {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
              </select>
            </label>
          </div>

          <div className="results-heading">
            <h2 id="library-heading">{query ? 'Hasil pencarian' : 'Tersimpan'}</h2>
            {loading && <span role="status">Memuat link…</span>}
          </div>

          {linksError && links.length === 0 ? (
            <div className="error-panel" role="alert">
              <p>{linksError}</p>
              <button className="text-button" type="button" onClick={() => {
                setLoading(true)
                loadLinks().catch((error: unknown) => {
                  setLinksError(error instanceof Error ? error.message : 'Link belum bisa dimuat.')
                }).finally(() => setLoading(false))
              }}>Coba lagi</button>
            </div>
          ) : loading && links.length === 0 ? (
            <div className="state-panel" role="status"><p>Memuat link dari arsipmu…</p></div>
          ) : links.length === 0 ? (
            <div className="empty-state">
              <div className="empty-mark" aria-hidden="true">[]</div>
              <h3>{query || statusFilter || collectionFilter || tagFilter ? 'Belum ada yang cocok.' : 'Belum ada link di sini.'}</h3>
              <p>{query || statusFilter || collectionFilter || tagFilter
                ? 'Coba kata pencarian lain atau hapus filter.'
                : 'Tempel link yang ingin kamu simpan. Judul dan domain akan diambil jika halamannya mengizinkan.'}</p>
              {(query || statusFilter || collectionFilter || tagFilter) && <button className="text-button" type="button" onClick={resetFilters}>Hapus filter</button>}
            </div>
          ) : (
            <div className="link-list">
              {links.map((link) => (
                <article className="link-entry" key={link.id}>
                  <div className="link-main">
                    <div className="link-domain">
                      {link.faviconUrl && <img src={link.faviconUrl} alt="" width="16" height="16" loading="lazy" referrerPolicy="no-referrer" />}
                      <span>{link.domain}</span>
                      <time dateTime={link.createdAt}>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(link.createdAt))}</time>
                      {link.metadataStatus === 'pending' && <span className="metadata-note">Membaca metadata…</span>}
                      {link.metadataStatus === 'unavailable' && <span className="metadata-note">Metadata tidak tersedia</span>}
                    </div>
                    <h3><a href={link.url} target="_blank" rel="noreferrer">{link.title}</a></h3>
                    {link.description && <p className="link-description">{link.description}</p>}
                    <div className="link-taxonomy">
                      {link.tags.map((tag) => (
                        <button
                          className="tag-chip"
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            setTagFilter(`${tag.id}`)
                            setCollectionFilter('')
                            setStatusFilter('')
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}
                      {link.collections.map((collection) => <span className="collection-name" key={collection.id}>{collection.name}</span>)}
                    </div>
                  </div>
                  <div className="link-actions">
                    <button className={`status-button status-${link.readStatus}`} type="button" onClick={() => void updateStatus(link)} aria-label={`Status ${statusLabels[link.readStatus]}. Klik untuk mengubah`}>
                      {statusLabels[link.readStatus]}
                    </button>
                    <button className="plain-action" type="button" onClick={() => startEditing(link)}>Edit</button>
                    <button className="plain-action delete-action" type="button" onClick={() => void deleteLink(link)}>Hapus</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <nav className="mobile-nav" aria-label="Status bacaan">
        <button className={!statusFilter && !collectionFilter && !tagFilter ? 'mobile-nav-item active' : 'mobile-nav-item'} type="button" onClick={resetFilters}>Semua</button>
        <button className={statusFilter === 'unread' ? 'mobile-nav-item active' : 'mobile-nav-item'} type="button" onClick={() => setStatus('unread')}>Belum dibaca</button>
        <button className={statusFilter === 'reading' ? 'mobile-nav-item active' : 'mobile-nav-item'} type="button" onClick={() => setStatus('reading')}>Sedang dibaca</button>
        <button className={statusFilter === 'done' ? 'mobile-nav-item active' : 'mobile-nav-item'} type="button" onClick={() => setStatus('done')}>Selesai</button>
      </nav>

      <dialog
        ref={dialogRef}
        className="app-dialog"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            setDialog(null)
            setEditingLink(null)
          }
        }}
        onCancel={(event) => {
          event.preventDefault()
          setDialog(null)
          setEditingLink(null)
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setDialog(null)
            setEditingLink(null)
          }
        }}
      >
        {dialog === 'collection' ? (
          <form className="dialog-form" onSubmit={createCollection}>
            <div className="dialog-heading">
              <div><p className="eyebrow">Atur arsip</p><h2>Koleksi baru</h2></div>
              <button className="plain-action" type="button" onClick={() => setDialog(null)}>Tutup</button>
            </div>
            <label htmlFor="collection-name">Nama koleksi</label>
            <input id="collection-name" value={collectionName} onChange={(event) => setCollectionName(event.target.value)} required maxLength={80} autoFocus />
            {dialogError && <p className="form-error" role="alert">{dialogError}</p>}
            <button className="button button-primary" type="submit">Buat koleksi</button>
          </form>
        ) : dialog === 'edit' && editingLink ? (
          <form className="dialog-form" onSubmit={saveEdit}>
            <div className="dialog-heading">
              <div><p className="eyebrow">Detail link</p><h2>Edit simpanan</h2></div>
              <button className="plain-action" type="button" onClick={() => { setDialog(null); setEditingLink(null) }}>Tutup</button>
            </div>
            <label htmlFor="edit-title">Judul</label>
            <input id="edit-title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required maxLength={500} autoFocus />
            {dialogError && <p className="form-error" role="alert">{dialogError}</p>}
            <label htmlFor="edit-description">Deskripsi</label>
            <textarea id="edit-description" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} maxLength={4000} rows={3} />
            <label htmlFor="edit-tags">Tag, pisahkan dengan koma</label>
            <input id="edit-tags" value={editTags} onChange={(event) => setEditTags(event.target.value)} />
            <label htmlFor="edit-status">Status baca</label>
            <select id="edit-status" value={editStatus} onChange={(event) => setEditStatus(event.target.value as ReadStatus)}>
              {statusOrder.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
            </select>
            {collections.length > 0 && (
              <fieldset className="collection-picker">
                <legend>Simpan ke koleksi</legend>
                {collections.map((collection) => (
                  <label className="checkbox-label" key={collection.id}>
                    <input
                      type="checkbox"
                      checked={editCollections.includes(collection.id)}
                      onChange={(event) => setEditCollections((current) => event.target.checked
                        ? [...current, collection.id]
                        : current.filter((id) => id !== collection.id))}
                    />
                    {collection.name}
                  </label>
                ))}
              </fieldset>
            )}
            <button className="button button-primary" type="submit" disabled={editSaving}>{editSaving ? 'Menyimpan…' : 'Simpan perubahan'}</button>
          </form>
        ) : null}
      </dialog>
    </div>
  )
}

export default App
