import { Bookmark, X } from "lucide-react";

type AddLinkDialogProps = {
  url: string;
  title: string;
  note: string;
  sharePublic: boolean;
  reminderDays: number;
  notificationPermission: "unknown" | "granted" | "denied" | "unsupported";
  error: string;
  isSaving: boolean;
  metadataLoading: boolean;
  metadataError: string;
  smartTags: string[];
  selectedTags: string[];
  onUrlChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onReminderDaysChange: (value: number) => void;
  onRequestNotifications: () => void;
  onShareChange: (value: boolean) => void;
  onSmartTagToggle: (tag: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onClearError: () => void;
};

export default function AddLinkDialog({
  url,
  title,
  note,
  sharePublic,
  reminderDays,
  notificationPermission,
  error,
  isSaving,
  metadataLoading,
  metadataError,
  smartTags,
  selectedTags,
  onUrlChange,
  onTitleChange,
  onNoteChange,
  onReminderDaysChange,
  onRequestNotifications,
  onShareChange,
  onSmartTagToggle,
  onClose,
  onSubmit,
  onClearError,
}: AddLinkDialogProps) {
  return (
    <div
      className="modal-backdrop"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        className="add-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-link-title"
        aria-describedby="add-link-description"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="modal-head">
          <div>
            <h2 id="add-link-title">Simpan link</h2>
            <p className="modal-description" id="add-link-description">
              Judul dan tag akan dicari otomatis saat disimpan. Kamu tetap bisa
              mengubahnya.
            </p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
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
            onChange={(event) => {
              onUrlChange(event.target.value);
              onClearError();
            }}
            placeholder="https://contoh.com"
          />
        </label>
        <label className="field-label">
          Judul link
          <input
            value={title}
            maxLength={500}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder={
              metadataLoading
                ? "Mengambil judul halaman..."
                : "Judul akan diisi otomatis"
            }
          />
          {(metadataLoading || metadataError) && (
            <small aria-live="polite">
              {metadataLoading
                ? "Mengambil judul dari halaman..."
                : metadataError}
            </small>
          )}
        </label>
        <div className="field-label smart-tag-field">
          <span>Tag arsip</span>
          <div className="filter-chips smart-tag-chips">
            {smartTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={selectedTags.includes(tag) ? "chip active" : "chip"}
                aria-pressed={selectedTags.includes(tag)}
                onClick={() => onSmartTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <small>Tag pertama yang dipilih menjadi kategori filter.</small>
        </div>
        <label className="field-label">
          Catatan kecil{" "}
          <textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Kenapa link ini menarik buat kamu?"
            rows={3}
          />
        </label>
        <label className="field-label">
          Pengingat baca
          <select
            value={reminderDays}
            onChange={(event) =>
              onReminderDaysChange(Number(event.target.value))
            }
          >
            <option value={0}>Tidak ada</option>
            <option value={1}>1 hari setelah disimpan</option>
            <option value={7}>7 hari setelah disimpan</option>
            <option value={30}>30 hari setelah disimpan</option>
          </select>
          <small>
            Pengingat tersimpan privat dan tetap terlihat di arsip.
          </small>
          {reminderDays > 0 && notificationPermission !== "granted" && (
            <div className="notification-permission">
              <button
                className="text-button"
                type="button"
                onClick={onRequestNotifications}
              >
                Izinkan notifikasi perangkat
              </button>
              <small aria-live="polite">
                {notificationPermission === "denied"
                  ? "Izin notifikasi belum aktif. Pengingat tetap tampil di aplikasi."
                  : notificationPermission === "unsupported"
                    ? "Notifikasi perangkat tidak tersedia. Pengingat tetap tampil di aplikasi."
                    : "Notifikasi perangkat opsional. Pengingat juga tampil di aplikasi."}
              </small>
            </div>
          )}
        </label>
        <div className="share-option">
          <label className="share-choice">
            <input
              type="checkbox"
              checked={sharePublic}
              onChange={(event) => onShareChange(event.target.checked)}
            />
            <span>
              <strong>Bagikan di Explore</strong>
              <small>
                URL, judul, dan tag terpilih bisa dilihat pengguna lain. Catatan
                dan status baca tetap privat.
              </small>
            </span>
          </label>
        </div>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="save-button modal-save"
          type="submit"
          disabled={isSaving}
        >
          <Bookmark size={16} />{" "}
          <span aria-live="polite">
            {isSaving ? "Mencari judul & tag..." : "Simpan link"}
          </span>
        </button>
      </form>
    </div>
  );
}
