import { Check, X } from "lucide-react";
import { getTranslations, localizeMessage, type Locale } from "../../lib/i18n";

type NoticeProps = {
  message: string;
  isError: boolean;
  onClose: () => void;
  locale: Locale;
};

export default function Notice({
  message,
  isError,
  onClose,
  locale,
}: NoticeProps) {
  const copy = getTranslations(locale);
  return (
    <div
      className={isError ? "notice error" : "notice"}
      role={isError ? "alert" : "status"}
    >
      {isError ? <X size={15} /> : <Check size={15} />}
      {localizeMessage(message, locale)}
      <button onClick={onClose} aria-label={copy.close}>
        <X size={14} />
      </button>
    </div>
  );
}
