import { getTranslations, type Locale } from "../../lib/i18n";

type LanguageSwitchProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
};

export default function LanguageSwitch({
  locale,
  onLocaleChange,
}: LanguageSwitchProps) {
  const copy = getTranslations(locale);
  const nextLocale = locale === "id" ? "en" : "id";

  return (
    <button
      className="language-switch"
      type="button"
      role="switch"
      aria-checked={locale === "en"}
      aria-label={copy.languageLabel}
      data-locale={locale}
      onClick={() => onLocaleChange(nextLocale)}
    >
      <span>ID</span>
      <span>EN</span>
    </button>
  );
}
