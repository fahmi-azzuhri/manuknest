import { Bookmark, X } from "lucide-react";

type AddLinkDialogProps = {
  url: string;
  title: string;
  note: string;
  sharePublic: boolean;
  error: string;
  isSaving: boolean;
  metadataLoading: boolean;
  metadataError: string;
  smartTags: string[];
  selectedTags: string[];
  onUrlChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onNoteChange: (value: string) => void;
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
  error,
  isSaving,
  metadataLoading,
  metadataError,
  smartTags,
  selectedTags,
  onUrlChange,
  onTitleChange,
  onNoteChange,
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
