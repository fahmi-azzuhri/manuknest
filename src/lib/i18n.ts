export type Locale = "id" | "en";

export const localeStorageKey = "tumpuk.locale";

const englishMessages: Record<string, string> = {
  "Server belum bisa dihubungi. Laporkan ke Developer!":
    "Can't reach the server. Please try again later.",
  "Server mengembalikan respons": "Server returned response",
  "Permintaan belum berhasil. Coba lagi.": "Request failed. Try again.",
  "Email atau kata sandi salah.": "Incorrect email or password.",
  "Email atau username tersebut sudah digunakan.":
    "That email or username is already in use.",
  "Kata sandi harus minimal 10 karakter dan maksimal 72 byte.":
    "Password must be at least 10 characters and no more than 72 bytes.",
  "Sesi akun sudah berakhir. Masuk lagi, ya.":
    "Your session has expired. Sign in again.",
  "Masuk dulu untuk melanjutkan.": "Sign in to continue.",
  "Akun belum bisa dibuat.": "Could not create the account.",
  "Akun belum bisa dibuka.": "Could not open the account.",
  "Sesi akun belum bisa dibuat.": "Could not create the account session.",
  "Pengaturan enkripsi akun belum valid.":
    "The account encryption settings are invalid.",
  "Pengaturan enkripsi belum bisa disimpan.":
    "Could not save the encryption settings.",
  "Permintaan tidak valid.": "The request is invalid.",
  "Alamat email belum valid.": "The email address is invalid.",
  "Link belum bisa dimuat.": "Could not load the link.",
  "Data link terenkripsi belum valid.": "The encrypted link data is invalid.",
  "URL atau judul publik belum valid.": "The public URL or title is invalid.",
  "Link tersebut sudah ada di koleksimu.":
    "That link is already in your collection.",
  "Link belum bisa disimpan.": "Could not save the link.",
  "Link tersimpan, tetapi belum bisa dimuat.":
    "The link was saved, but could not be loaded.",
  "Link belum bisa diperbarui.": "Could not update the link.",
  "Link belum bisa dihapus.": "Could not delete the link.",
  "Link tidak ditemukan.": "Link not found.",
  "Pencarian dan filter link dilakukan di perangkat.":
    "Search and link filters run on this device.",
  "URL link belum valid.": "The link URL is invalid.",
  "Judul halaman belum bisa diambil.": "Could not fetch the page title.",
  "Link terpopuler belum bisa dimuat.": "Could not load popular links.",
  "Tag link Explore belum bisa dimuat.": "Could not load Explore link tags.",
  "Link publik tidak ditemukan.": "Public link not found.",
  "Link publik belum bisa dimuat.": "Could not load the public link.",
  "Kamu tidak bisa menyukai link yang kamu bagikan sendiri.":
    "You can't like a link you shared.",
  "Link belum bisa disukai.": "Could not like the link.",
  "Suka belum bisa dihapus.": "Could not remove the like.",
  "Jumlah suka belum bisa dimuat.": "Could not load the like count.",
  "Profil belum bisa dimuat.": "Could not load the profile.",
  "Profil belum bisa disimpan.": "Could not save the profile.",
  "Profil tidak ditemukan.": "Profile not found.",
  "Username tersebut sudah digunakan.": "That username is already in use.",
  "Statistik profil belum bisa dimuat.": "Could not load profile statistics.",
  "Tag belum bisa dimuat.": "Could not load tags.",
  "Tag belum bisa dibuat.": "Could not create the tag.",
  "Koleksi belum bisa dimuat.": "Could not load collections.",
  "Koleksi belum bisa dibuat.": "Could not create the collection.",
  "Link yang dibagikan belum bisa dimuat.": "Could not load shared links.",
  "Tag link profil belum bisa dimuat.": "Could not load profile link tags.",
  "Permintaan tag tidak valid.": "The tag request is invalid.",
  "Salt enkripsi akun tidak valid.": "The account encryption salt is invalid.",
  "Masukkan URL HTTP atau HTTPS yang valid.":
    "Enter a valid HTTP or HTTPS URL.",
  "URL maksimal 2048 karakter.": "URL must be 2048 characters or fewer.",
  "Data link terenkripsi tidak valid.": "The encrypted link data is invalid.",
  "Data terenkripsi tidak didukung.":
    "This encrypted data format is unsupported.",
  "Kunci enkripsi arsip tidak cocok dengan akun ini.":
    "The archive encryption key doesn't match this account.",
  "Pengaturan enkripsi akun belum lengkap. Hubungi admin.":
    "Account encryption settings are incomplete. Contact an administrator.",
  "Arsip belum bisa dibuka.": "Could not unlock the archive.",
  "Username harus 3-24 karakter, diawali huruf atau angka, dan hanya memakai huruf, angka, atau garis bawah.":
    "Username must be 3-24 characters, start with a letter or number, and contain only letters, numbers, or underscores.",
  "Tempel link satu lagu dari YouTube Music.":
    "Paste one song link from YouTube Music.",
  "Link YouTube Music belum berisi ID lagu yang valid.":
    "The YouTube Music link does not contain a valid song ID.",
};

export function localizeMessage(message: string, locale: Locale): string {
  if (locale !== "en") return message;
  const mapped = englishMessages[message];
  if (mapped) return mapped;
  const response = message.match(
    /^Server mengembalikan respons (\d+)\. Laporkan ke Developer!?\.?$/,
  );
  return response
    ? `Server returned response ${response[1]}. Contact the app administrator.`
    : message;
}

const id = {
  language: "Bahasa",
  languageLabel: "Ganti bahasa",
  id: "ID",
  en: "EN",
  lightTheme: "Aktifkan tema terang",
  darkTheme: "Aktifkan tema gelap",
  signOut: "Keluar",
  signOutFrom: (email: string) => `Keluar dari akun ${email}`,
  close: "Tutup",
  home: "Home",
  saved: "Saved",
  explore: "Explore",
  profile: "Profile",
  mainNavigation: "Navigasi utama",
  registerTitle: "Buat sarangmu.",
  loginTitle: "Masuk ke sarang",
  registerDescription:
    "Daftar untuk mulai menyimpan halaman yang ingin kamu temukan lagi.",
  loginDescription: "Masuk untuk melanjutkan ke koleksi link yang kamu simpan",
  username: "Username",
  usernamePlaceholder: "contoh: tiko_7",
  email: "Email",
  emailPlaceholder: "nama@email.com",
  password: "Kata sandi",
  minimumPasswordPlaceholder: "Minimal 10 karakter",
  accountPassword: "Kata sandi akun",
  accountPasswordPlaceholder: "Kata sandi akunmu",
  optional: "(opsional)",
  profileSong: "Lagu profil",
  youtubeMusicHint: "Tempel link satu lagu dari YouTube Music.",
  connecting: "Menghubungkan...",
  createAccount: "Buat akun",
  login: "Masuk",
  alreadyAccount: "Sudah punya akun?",
  noAccount: "Belum punya akun?",
  signUp: "Daftar",
  encryptedArchive: "ARSIP TERENKRIPSI",
  unlockArchive: "Buka arsipmu.",
  unlockDescription:
    "Masukkan kata sandi untuk membuka link yang tersimpan di perangkat ini.",
  openingArchive: "Membuka arsip...",
  openArchive: "Buka arsip",
  account: "Akun:",
  switchAccount: "Ganti akun",
  loadingSavedLinks: "Memuat link tersimpan...",
  saveLinkPlaceholder: "Tempel link yang ingin kamu simpan...",
  save: "Simpan",
  savedLinks: "link tersimpan",
  exploredTopics: "topik dijelajahi",
  totalCollection: "TOTAL KOLEKSI",
  categories: "KATEGORI",
  tikoMessage: "PESAN DARI TIKO",
  tikoEncouragement: "Pelan-pelan aja. Ide bagus layak disimpan. 🌱",
  nestImportantLinks: "Sarangnya link-link penting lo!",
  findSavedPages: "Temukan lagi halaman yang kamu simpan kapan pun.",
  filterCategory: "Filter kategori",
  saveDialogTitle: "Simpan link",
  saveDialogDescription:
    "Judul dan tag akan dicari otomatis saat disimpan. Kamu tetap bisa mengubahnya.",
  linkUrl: "URL link",
  linkTitle: "Judul link",
  fetchingTitle: "Mengambil judul halaman...",
  fetchingTitleShort: "Mengambil judul dari halaman...",
  titleNotFound: "Judul halaman tidak ditemukan.",
  archiveTags: "Tag arsip",
  smallNote: "Catatan kecil",
  whyInteresting: "Kenapa link ini menarik buat kamu?",
  readingReminder: "Pengingat baca",
  noReminder: "Tidak ada",
  reminderOneDay: "1 hari setelah disimpan",
  reminderSevenDays: "7 hari setelah disimpan",
  reminderThirtyDays: "30 hari setelah disimpan",
  enableNotifications: "Izinkan notifikasi perangkat",
  notificationsInactive:
    "Izin notifikasi belum aktif. Pengingat tetap tampil di aplikasi.",
  notificationsUnavailable:
    "Notifikasi perangkat tidak tersedia. Pengingat tetap tampil di aplikasi.",
  notificationsOptional:
    "Notifikasi perangkat opsional. Pengingat juga tampil di aplikasi.",
  shareExplore: "Bagikan di Explore",
  saving: "Sedang menyimpan...",
  statusNotificationUnreadable: "Status notifikasi tidak dapat dibaca.",
  notificationAllowed: "Notifikasi pengingat sudah diizinkan.",
  adultPrivate:
    "Link konten dewasa disimpan pribadi dan tidak dibagikan di Explore.",
  linkSaved: "Link berhasil disimpan.",
  profileUpdated: "Profil berhasil diperbarui.",
  reminderPostponed: "Pengingat ditunda 1 hari.",
  noNote: "Belum ada catatan.",
  missingDate: "Tanggal tidak tersedia",
  invalidHttpUrl: "Masukkan URL HTTP atau HTTPS yang valid.",
  maxUrlLength: "URL maksimal 2048 karakter.",
  status: (status: number) =>
    `Server mengembalikan respons ${status}. Laporkan ke Developer!.`,
  requestFailed: "Permintaan belum berhasil. Coba lagi.",
  serverUnavailable: "Server belum bisa dihubungi. Laporkan ke Developer!",
  exploreSharedBy: "Dibagikan oleh",
  sharedByManuknest: "Dibagikan oleh pengguna Manuknest",
  ownLink: (count: number) => `Link milikmu, ${count} suka`,
  removeLike: (count: number) => `Hapus sukamu, ${count} suka`,
  likeLink: (count: number) => `Sukai link, ${count} suka`,
  ownSharedLink: "Link ini kamu bagikan",
  openLink: (title: string) => `Buka ${title}`,
  readStatus: (title: string) => `Status baca untuk ${title}`,
  unread: "Belum dilihat",
  done: "Selesai",
  reminder: (date: string) => `Pengingat ${date}`,
  snooze: "Tunda 1 hari",
  shared: "Dibagikan",
  loadingExplore: "Memuat link Explore...",
  exploreLoadFailed: "Link Explore belum bisa dimuat.",
  retry: "Coba lagi",
  noSharedLinks: "Belum ada link yang dibagikan.",
  backHome: "Kembali ke Home",
  sharedLinksHint:
    "Link yang dibagikan akan muncul di sini. Pemiliknya memilih untuk menampilkan URL dan judulnya.",
  noResults: "Belum ketemu, nih.",
  resetSearch: "Reset pencarian",
  searchHint: "Coba kata kunci lain atau pilih kategori berbeda.",
  noSavedLinks: "Belum ada link tersimpan.",
  noRecentLinks: "Belum ada link terbaru.",
  saveFirstLink: "Simpan link pertama",
  saveFirstHint:
    "Tempel URL, lalu pilih kategori dan tambahkan catatan kalau perlu.",
  openAllLinks: (count: number) => `Buka semua ${count} link`,
  readingReminders: "Pengingat bacaan",
  remindersDue: "Link yang sudah waktunya kamu buka lagi.",
  editProfile: "Edit profil",
  setProfileUsername: "Atur username profil",
  usernameHint:
    "Username harus unik. Gunakan 3-24 huruf, angka, atau garis bawah.",
  youtubeMusic: "Lagu YouTube Music",
  musicHint:
    "Opsional. Tempel link satu lagu; kosongkan untuk menghapus pemutar musik.",
  cancel: "Batal",
  savingProfile: "Menyimpan...",
  saveProfile: "Simpan profil",
  profileStats: "Statistik profil",
  sharedCount: "Dibagikan",
  likesGiven: "Menyukai",
  likesReceived: "Disukai",
  joined: "Bergabung",
  noProfileSong:
    "Belum ada lagu profil. Tambahkan satu link lagu YouTube Music lewat Edit profil.",
  loadingProfileStats: "Memuat statistik profil...",
  profileLoadFailed: "Profil belum bisa dimuat.",
  backExplore: "Kembali ke Explore",
  loadingProfile: (username: string) => `Memuat profil @${username}...`,
  sharedLinks: "Link yang dibagikan",
  profileSongLabel: "Lagu profil",
  noSharedProfileLinks: "Belum ada link yang dibagikan.",
  playerLoadFailed: "Pemutar YouTube gagal dimuat.",
  songUnavailable: "Lagu ini tidak bisa diputar di sini.",
  playerUnavailable: "Pemutar belum bisa dimuat.",
  songLoading: "Memuat lagu...",
  openYouTubeMusic: "Buka lagu di YouTube Music",
  songPosition: "Posisi lagu",
  unmute: "Nyalakan suara",
  mute: "Bisukan suara",
  rewind: "Mundur 10 detik",
  forward: "Maju 10 detik",
  pause: "Jeda",
  play: "Putar",
  repeat: "Ulangi lagu",
  stopRepeat: "Hentikan pengulangan",
  mascotLabel: "Tiko, burung kecil di sarang. Klik untuk membuatnya terbang.",
  eggLabel: (count: number) => `Telur di sarang, ${count} link tersimpan.`,
  automaticTitlePlaceholder: "Judul akan diisi otomatis",
  searchSavedPlaceholder: "Cari sesuatu yang kamu simpan...",
  searchSavedLabel: "Cari link tersimpan",
  latestLinks: "Link terbaru",
  exploreDescription: "Jelajahi link yang dibagikan pengguna lain.",
  viewAll: "Lihat semua",
  allCategories: "Semua",
  notificationStatusError: (message: string) =>
    `Status notifikasi tidak dapat dibaca: ${message}`,
  reminderScheduleError: (message: string) =>
    `Notifikasi pengingat belum bisa dijadwalkan: ${message}`,
  notificationEnableError: (message: string) =>
    `Izin notifikasi tidak dapat diaktifkan: ${message}`,
  confirmDeleteLink: (title: string) =>
    `Hapus "${title}" dari arsipmu? Tindakan ini tidak bisa dibatalkan.`,
  deleteLinkLabel: (title: string) => `Hapus ${title}`,
  deleteLinkNotice: (title: string) => `"${title}" dihapus dari arsip.`,
  linkDeleteNotificationError:
    "Link dihapus, tetapi notifikasinya belum bisa dibatalkan.",
  deletedButNotificationFailed: (message: string) =>
    `Link dihapus, tetapi notifikasinya belum bisa dibatalkan: ${message}`,
  apiResponse: (status: number) =>
    `Server mengembalikan respons ${status}. Laporkan ke Developer!.`,
  legacyLinkIncomplete: "Ada link lama yang datanya tidak lengkap.",
  vaultKeyMismatch: "Kunci enkripsi arsip tidak cocok dengan akun ini.",
  vaultSettingsIncomplete:
    "Pengaturan enkripsi akun belum lengkap. Hubungi admin.",
  archiveOpenFailed: "Arsip belum bisa dibuka.",
  accountOpenFailed: "Akun belum bisa dibuka.",
  linkLoadFailed: "Link belum bisa dimuat.",
  invalidPageTitle: "Judul halaman tidak ditemukan.",
  metadataTitleRestricted:
    "Judul halaman dibatasi. Judul dari alamat link dipakai.",
  metadataApiOutdated:
    "API belum diperbarui untuk mengambil judul. Hubungi pengelola aplikasi.",
  metadataUnavailable: "Judul halaman belum bisa diambil otomatis.",
  pasteLinkError: "Tempel link yang ingin kamu simpan.",
  invalidLinkError: "Format link belum valid. Coba periksa lagi.",
  sharedTitleTooLong: "Judul untuk link yang dibagikan terlalu panjang.",
  metadataTitleUnreadable:
    "Judul halaman tidak dapat dibaca. Judul dari alamat link dipakai.",
  metadataApiUpdate:
    "API belum diperbarui untuk mengambil judul otomatis. Perbarui backend API agar fitur ini berfungsi.",
  metadataCustomTitleFallback:
    "Metadata halaman tidak tersedia. Judul yang kamu isi tetap digunakan.",
  metadataDomainFallback:
    "Metadata halaman tidak tersedia. Nama domain dipakai. Link berhasil disimpan.",
  savedAndShared: "Link disimpan dan dibagikan di Explore.",
  savedWithTiko: "Link berhasil disimpan. Tiko ikut senang!",
  missingTitleFallback:
    "Judul halaman tidak ditemukan, nama domain dipakai. Link berhasil disimpan.",
  localTagSuggestions: "Saran tag lokal dipakai.",
  saveLinkFailed: "Link belum bisa disimpan.",
  changesNotSaved: "Perubahan link belum bisa disimpan.",
  completedLink: "Link ditandai selesai. Pengingatnya dihapus.",
  readingStatusUpdated: "Status baca link diperbarui.",
  likeUpdateFailed: "Suka belum bisa diperbarui.",
  profileNotSaved: "Profil belum bisa disimpan.",
  bookmarksExported: "Bookmark berhasil diekspor.",
  bookmarksImported: (added: number, skipped: number, invalid: number) =>
    `${added} diimpor, ${skipped} duplikat dilewati, ${invalid} baris tidak valid.`,
  bookmarkImportFailed:
    "Impor gagal. Periksa format JSON atau koneksi, lalu coba lagi.",
  bookmarkDataTitle: "Data bookmark",
  bookmarkDataDescription:
    "Simpan salinan atau pindahkan bookmark dari perangkat lain.",
  bookmarkExportTitle: "Unduh salinan",
  bookmarkExportDescription: "Ekspor semua bookmark ke file JSON.",
  bookmarkExportAction: "Ekspor JSON",
  bookmarkImportTitle: "Tambahkan dari file",
  bookmarkImportDescription: "URL yang sudah tersimpan akan dilewati.",
  bookmarkImportAction: "Impor JSON",
  linkNotDeleted: "Link belum bisa dihapus.",
  notificationTitle: "Waktunya membaca",
  notificationBody: "Buka Manuknest untuk melihat link pengingatmu.",
  mascotChirp: "Cuit! Ada link menarik? Simpan dulu, ya.",
  mascotHatchHint: "Simpan sampai 3 link agar Tiko bisa menetas.",
  mascotHatchCount: (count: number) =>
    `Simpan ${count} link lagi, yuk, biar telurnya menetas.`,
} as const;

const en = {
  ...id,
  language: "Language",
  languageLabel: "Change language",
  usernamePlaceholder: "e.g. tiko_7",
  emailPlaceholder: "name@example.com",
  minimumPasswordPlaceholder: "At least 10 characters",
  accountPasswordPlaceholder: "Your account password",
  lightTheme: "Switch to light theme",
  darkTheme: "Switch to dark theme",
  signOut: "Sign out",
  signOutFrom: (email: string) => `Sign out of ${email}`,
  mainNavigation: "Main navigation",
  registerTitle: "Build your nest.",
  loginTitle: "Enter your nest",
  registerDescription: "Sign up to save pages you want to find again.",
  loginDescription: "Sign in to continue to your saved links",
  password: "Password",
  accountPassword: "Account password",
  optional: "(optional)",
  profileSong: "Profile song",
  youtubeMusicHint: "Paste one song link from YouTube Music.",
  connecting: "Connecting...",
  createAccount: "Create account",
  login: "Sign in",
  alreadyAccount: "Already have an account?",
  noAccount: "Don't have an account?",
  signUp: "Sign up",
  encryptedArchive: "ENCRYPTED ARCHIVE",
  unlockArchive: "Unlock your archive.",
  unlockDescription: "Enter your password to open links saved on this device.",
  openingArchive: "Opening archive...",
  openArchive: "Unlock archive",
  account: "Account:",
  switchAccount: "Switch account",
  loadingSavedLinks: "Loading saved links...",
  saveLinkPlaceholder: "Paste a link to save...",
  save: "Save",
  savedLinks: "saved links",
  exploredTopics: "topics explored",
  totalCollection: "TOTAL COLLECTION",
  categories: "CATEGORIES",
  tikoMessage: "MESSAGE FROM TIKO",
  tikoEncouragement: "Take it slow. Good ideas are worth saving. 🌱",
  nestImportantLinks: "Your nest for important links.",
  findSavedPages: "Find pages you saved whenever you need them.",
  filterCategory: "Filter by category",
  saveDialogTitle: "Save link",
  saveDialogDescription:
    "The title and tags are suggested automatically. You can still edit them.",
  linkUrl: "Link URL",
  linkTitle: "Link title",
  fetchingTitle: "Fetching page title...",
  fetchingTitleShort: "Fetching title from page...",
  titleNotFound: "Page title not found.",
  archiveTags: "Archive tags",
  smallNote: "Short note",
  whyInteresting: "Why is this link interesting to you?",
  readingReminder: "Reading reminder",
  noReminder: "None",
  reminderOneDay: "1 day after saving",
  reminderSevenDays: "7 days after saving",
  reminderThirtyDays: "30 days after saving",
  enableNotifications: "Allow device notifications",
  notificationsInactive:
    "Notifications are off. Reminders still appear in the app.",
  notificationsUnavailable:
    "Device notifications are unavailable. Reminders still appear in the app.",
  notificationsOptional:
    "Device notifications are optional. Reminders also appear in the app.",
  shareExplore: "Share on Explore",
  saving: "Saving...",
  statusNotificationUnreadable: "Notification status is unavailable.",
  notificationAllowed: "Reminder notifications are allowed.",
  adultPrivate: "Adult links stay private and are not shared on Explore.",
  linkSaved: "Link saved.",
  profileUpdated: "Profile updated.",
  reminderPostponed: "Reminder postponed by 1 day.",
  noNote: "No note yet.",
  missingDate: "Date unavailable",
  invalidHttpUrl: "Enter a valid HTTP or HTTPS URL.",
  maxUrlLength: "URL must be 2048 characters or fewer.",
  status: (status: number) =>
    `Server returned response ${status}. Report it to Developer!.`,
  requestFailed: "Request failed. Try again.",
  serverUnavailable: "Server unavailable. Report it to Developer!",
  close: "Close",
  exploreSharedBy: "Shared by",
  sharedByManuknest: "Shared by a Manuknest user",
  ownLink: (count: number) => `Your link, ${count} likes`,
  removeLike: (count: number) => `Remove your like, ${count} likes`,
  likeLink: (count: number) => `Like link, ${count} likes`,
  ownSharedLink: "You shared this link",
  openLink: (title: string) => `Open ${title}`,
  readStatus: (title: string) => `Reading status for ${title}`,
  unread: "Unread",
  done: "Done",
  reminder: (date: string) => `Reminder ${date}`,
  snooze: "Snooze 1 day",
  shared: "Shared",
  loadingExplore: "Loading Explore links...",
  exploreLoadFailed: "Explore links could not be loaded.",
  retry: "Try again",
  noSharedLinks: "No shared links yet.",
  backHome: "Back to Home",
  sharedLinksHint:
    "Shared links appear here when their owners choose to show their URLs and titles.",
  noResults: "Nothing found.",
  resetSearch: "Reset search",
  searchHint: "Try another keyword or choose a different category.",
  noSavedLinks: "No saved links yet.",
  noRecentLinks: "No recent links yet.",
  saveFirstLink: "Save your first link",
  saveFirstHint:
    "Paste a URL, then choose a category and add a note if needed.",
  openAllLinks: (count: number) => `Open all ${count} links`,
  readingReminders: "Reading reminders",
  remindersDue: "Links ready for another look.",
  editProfile: "Edit profile",
  setProfileUsername: "Set profile username",
  usernameHint:
    "Username must be unique. Use 3-24 letters, numbers, or underscores.",
  youtubeMusic: "YouTube Music song",
  musicHint:
    "Optional. Paste one song link; leave empty to remove the music player.",
  cancel: "Cancel",
  savingProfile: "Saving...",
  saveProfile: "Save profile",
  profileStats: "Profile statistics",
  sharedCount: "Shared",
  likesGiven: "Liked",
  likesReceived: "Likes received",
  joined: "Joined",
  noProfileSong:
    "No profile song yet. Add one YouTube Music link through Edit profile.",
  loadingProfileStats: "Loading profile statistics...",
  profileLoadFailed: "Profile could not be loaded.",
  backExplore: "Back to Explore",
  loadingProfile: (username: string) => `Loading profile @${username}...`,
  sharedLinks: "Shared links",
  profileSongLabel: "Profile song",
  noSharedProfileLinks: "No shared links yet.",
  playerLoadFailed: "YouTube player failed to load.",
  songUnavailable: "This song cannot play here.",
  playerUnavailable: "Player could not be loaded.",
  songLoading: "Loading song...",
  openYouTubeMusic: "Open song in YouTube Music",
  songPosition: "Song position",
  unmute: "Turn sound on",
  mute: "Mute",
  rewind: "Rewind 10 seconds",
  forward: "Forward 10 seconds",
  pause: "Pause",
  play: "Play",
  repeat: "Repeat song",
  stopRepeat: "Stop repeating",
  mascotLabel: "Tiko, a small bird in the nest. Click to make it fly.",
  eggLabel: (count: number) => `Egg in nest, ${count} saved links.`,
  automaticTitlePlaceholder: "Title will be filled in automatically",
  searchSavedPlaceholder: "Search your saved links...",
  searchSavedLabel: "Search saved links",
  latestLinks: "Latest links",
  exploreDescription: "Explore links shared by other users.",
  viewAll: "View all",
  allCategories: "All",
  notificationStatusError: (message: string) =>
    `Notification status is unavailable: ${message}`,
  reminderScheduleError: (message: string) =>
    `Could not schedule the reminder notification: ${message}`,
  notificationEnableError: (message: string) =>
    `Could not enable notifications: ${message}`,
  confirmDeleteLink: (title: string) =>
    `Remove "${title}" from your archive? This can't be undone.`,
  deleteLinkLabel: (title: string) => `Delete ${title}`,
  deleteLinkNotice: (title: string) =>
    `"${title}" was removed from your archive.`,
  linkDeleteNotificationError:
    "Link deleted, but its reminder notification could not be canceled.",
  deletedButNotificationFailed: (message: string) =>
    `Link deleted, but its reminder couldn't be canceled: ${message}`,
  apiResponse: (status: number) =>
    `Server returned response ${status}. Contact the app administrator.`,
  legacyLinkIncomplete: "An older link is missing required data.",
  vaultKeyMismatch: "The archive encryption key doesn't match this account.",
  vaultSettingsIncomplete:
    "Account encryption settings are incomplete. Contact an administrator.",
  archiveOpenFailed: "Could not unlock the archive.",
  accountOpenFailed: "Could not open the account.",
  linkLoadFailed: "Could not load links.",
  invalidPageTitle: "Page title not found.",
  metadataTitleRestricted:
    "The page title is restricted. The link address will be used instead.",
  metadataApiOutdated:
    "The API is outdated and can't fetch page titles. Contact the app administrator.",
  metadataUnavailable: "Could not fetch the page title automatically.",
  pasteLinkError: "Paste a link to save.",
  invalidLinkError: "This link format is invalid. Check it and try again.",
  sharedTitleTooLong: "The title is too long to share.",
  metadataTitleUnreadable:
    "The page title could not be read. The link address will be used instead.",
  metadataApiUpdate:
    "The API is outdated and can't fetch page titles. Update the backend API to enable this feature.",
  metadataCustomTitleFallback:
    "Page metadata is unavailable. Your title will still be used.",
  metadataDomainFallback:
    "Page metadata is unavailable. The domain name will be used. Link saved.",
  savedAndShared: "Link saved and shared on Explore.",
  savedWithTiko: "Link saved. Tiko is happy too!",
  missingTitleFallback:
    "Page title not found. The domain name will be used. Link saved.",
  localTagSuggestions: "Using local tag suggestions.",
  saveLinkFailed: "Could not save the link.",
  changesNotSaved: "Could not save link changes.",
  completedLink: "Link marked as done. Its reminder was removed.",
  readingStatusUpdated: "Link reading status updated.",
  likeUpdateFailed: "Could not update the like.",
  profileNotSaved: "Could not save the profile.",
  bookmarksExported: "Bookmarks exported.",
  bookmarksImported: (added: number, skipped: number, invalid: number) =>
    `${added} imported, ${skipped} duplicates skipped, ${invalid} invalid entries.`,
  bookmarkImportFailed:
    "Import failed. Check JSON format or connection, then try again.",
  bookmarkDataTitle: "Bookmark data",
  bookmarkDataDescription:
    "Keep a copy or bring bookmarks over from another device.",
  bookmarkExportTitle: "Download a copy",
  bookmarkExportDescription: "Export every bookmark to a JSON file.",
  bookmarkExportAction: "Export JSON",
  bookmarkImportTitle: "Add from a file",
  bookmarkImportDescription: "URLs already saved will be skipped.",
  bookmarkImportAction: "Import JSON",
  bookmarkDataFormat: "Format: JSON",
  linkNotDeleted: "Could not delete the link.",
  notificationTitle: "Time to read",
  notificationBody: "Open Manuknest to view your reminder link.",
  mascotChirp: "Chirp! Found an interesting link? Save it first.",
  mascotHatchHint: "Save 3 links to hatch Tiko.",
  mascotHatchCount: (count: number) =>
    `Save ${count} more link${count === 1 ? "" : "s"} to hatch the egg.`,
} as const;

export const translations = { id, en } as const;
export type TranslationKey = keyof typeof id;

const translatedCategories: Record<string, string> = {
  Desain: "Design",
  Lagu: "Music",
  Film: "Movies",
  Artikel: "Articles",
  Edukasi: "Learning",
  Berita: "News",
  Referensi: "Reference",
  Semua: "All",
};

export function translateCategory(category: string, locale: Locale): string {
  return locale === "en"
    ? translatedCategories[category] ?? category
    : category;
}

export function initialLocale(): Locale {
  const stored = window.localStorage.getItem(localeStorageKey);
  if (stored === "id" || stored === "en") return stored;
  return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
}

export function getTranslations(locale: Locale) {
  return translations[locale];
}
