import { Bookmark, X } from "lucide-react";
import {
  getTranslations,
  localizeMessage,
  translateCategory,
  type Locale,
} from "../../lib/i18n";

type AddLinkDialogProps = {
  url: string;
  title: string;
  note: string;
  sharePublic: boolean;
  isAdultContentBlocked: boolean;
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
  locale: Locale;
};

export default function AddLinkDialog({
  url,
  title,
  note,
  sharePublic,
  isAdultContentBlocked,
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
  locale,
}: AddLinkDialogProps) {
  const copy = getTranslations(locale);

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
            <h2 id="add-link-title">{copy.saveDialogTitle}</h2>
            <p className="modal-description" id="add-link-description">
              {copy.saveDialogDescription}
            </p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label={copy.close}
          >
            <X size={18} />
          </button>
        </div>
        <label className="field-label">
          {copy.linkUrl}
          <input
            autoFocus
            required
            value={url}
            onChange={(event) => {
              onUrlChange(event.target.value);
              onClearError();
            }}
            placeholder={copy.linkUrl}
          />
        </label>
        <label className="field-label">
          {copy.linkTitle}
          <input
            value={title}
            maxLength={500}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder={
              metadataLoading
                ? copy.fetchingTitle
                : copy.automaticTitlePlaceholder
            }
          />
          {(metadataLoading || metadataError) && (
            <small aria-live="polite">
              {metadataLoading
                ? copy.fetchingTitleShort
                : localizeMessage(metadataError, locale)}
            </small>
          )}
        </label>
        <div className="field-label smart-tag-field">
          <span>{copy.archiveTags}</span>
          <div className="filter-chips smart-tag-chips">
            {smartTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={selectedTags.includes(tag) ? "chip active" : "chip"}
                aria-pressed={selectedTags.includes(tag)}
                onClick={() => onSmartTagToggle(tag)}
              >
                {translateCategory(tag, locale)}
              </button>
            ))}
          </div>
        </div>
        <label className="field-label">
          {copy.smallNote}{" "}
          <textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={copy.whyInteresting}
            rows={3}
          />
        </label>
        <label className="field-label">
          {copy.readingReminder}
          <select
            value={reminderDays}
            onChange={(event) =>
              onReminderDaysChange(Number(event.target.value))
            }
          >
            <option value={0}>{copy.noReminder}</option>
            <option value={1}>{copy.reminderOneDay}</option>
            <option value={7}>{copy.reminderSevenDays}</option>
            <option value={30}>{copy.reminderThirtyDays}</option>
          </select>
          {reminderDays > 0 && notificationPermission !== "granted" && (
            <div className="notification-permission">
              <button
                className="text-button"
                type="button"
                onClick={onRequestNotifications}
              >
                {copy.enableNotifications}
              </button>
              <small aria-live="polite">
                {notificationPermission === "denied"
                  ? copy.notificationsInactive
                  : notificationPermission === "unsupported"
                  ? copy.notificationsUnavailable
                  : copy.notificationsOptional}
              </small>
            </div>
          )}
        </label>
        <div className="share-option">
          <label className="share-choice">
            <input
              type="checkbox"
              checked={!isAdultContentBlocked && sharePublic}
              disabled={isAdultContentBlocked}
              onChange={(event) => onShareChange(event.target.checked)}
            />
            <span>
              <strong>{copy.shareExplore}</strong>
              {isAdultContentBlocked && (
                <small role="status">{copy.adultPrivate}</small>
              )}
            </span>
          </label>
        </div>
        {error && (
          <p className="auth-error" role="alert">
            {localizeMessage(error, locale)}
            {localizeMessage(error, locale)}
          </p>
        )}
        <button
          className="save-button modal-save"
          type="submit"
          disabled={isSaving}
        >
          <Bookmark size={16} />{" "}
          <span aria-live="polite">
            {isSaving ? copy.saving : copy.saveDialogTitle}
          </span>
        </button>
      </form>
    </div>
  );
}
