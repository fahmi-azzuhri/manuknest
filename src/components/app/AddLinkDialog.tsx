import { Bookmark, X } from "lucide-react";

type AddLinkDialogProps = {
  url: string;
  title: string;
  category: string;
  note: string;
  sharePublic: boolean;
  error: string;
  isSaving: boolean;
  categories: string[];
  onUrlChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onShareChange: (value: boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
  onClearError: () => void;
};

export default function AddLinkDialog({
  url,
  title,
  category,
  note,
  sharePublic,
  error,
  isSaving,
  categories,
  onUrlChange,
  onTitleChange,
  onCategoryChange,
  onNoteChange,
  onShareChange,
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
            <span className="eyebrow muted">DETAIL LINK</span>
            <h2 id="add-link-title">Simpan link</h2>
            <p className="modal-description" id="add-link-description">
              Judul, kategori, dan catatan disimpan di arsip pribadimu.
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
            placeholder="Kosongkan untuk memakai nama domain"
          />
        </label>
        <label className="field-label">
          Kategori
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
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
                URL dan judul link bisa dilihat pengguna lain. Catatan,
                kategori, dan status baca tetap privat.
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
          <Bookmark size={16} /> {isSaving ? "Menyimpan..." : "Simpan link"}
        </button>
      </form>
    </div>
  );
}
