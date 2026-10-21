import type { ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import { getTranslations, type Locale } from "../../lib/i18n";

type ImportExportProps = {
  locale: Locale;
  status: string;
  onExport: () => void;
  onImport: (file: File) => void;
};

export default function ImportExportSection({
  locale,
  status,
  onExport,
  onImport,
}: ImportExportProps) {
  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImport(file);
    event.target.value = "";
  }

  const id = `import-bookmarks-${locale}`;
  const copy = getTranslations(locale);

  return (
    <section className="profile-data" aria-labelledby="bookmark-data-title">
      <div className="profile-data-heading">
        <div>
          <h2 id="bookmark-data-title">{copy.bookmarkDataTitle}</h2>
          <p>{copy.bookmarkDataDescription}</p>
        </div>
      </div>
      <div className="profile-data-actions">
        <div className="profile-data-action">
          <div className="profile-data-copy">
            <Download size={20} aria-hidden="true" />
            <div>
              <strong>{copy.bookmarkExportTitle}</strong>
              <span>{copy.bookmarkExportDescription}</span>
            </div>
          </div>
          <button
            className="profile-edit-button"
            type="button"
            onClick={onExport}
          >
            {copy.bookmarkExportAction}
          </button>
        </div>
        <div className="profile-data-action">
          <div className="profile-data-copy">
            <Upload size={20} aria-hidden="true" />
            <div>
              <strong>{copy.bookmarkImportTitle}</strong>
              <span>{copy.bookmarkImportDescription}</span>
            </div>
          </div>
          <input
            id={id}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImport}
          />
          <label className="save-button" htmlFor={id}>
            {copy.bookmarkImportAction}
          </label>
        </div>
      </div>
      {status && (
        <p className="profile-data-status" role="status">
          {status}
        </p>
      )}
    </section>
  );
}
