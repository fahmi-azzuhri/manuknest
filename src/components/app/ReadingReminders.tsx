import type { SavedLink } from "./types";
import { formatShortDate } from "./types";
import { getTranslations, type Locale } from "../../lib/i18n";

type ReadingRemindersProps = {
  locale: Locale;
  links: SavedLink[];
  onSnooze: (link: SavedLink) => void;
  onMarkFinished: (link: SavedLink) => void;
};

export default function ReadingReminders({
  locale,

  links,
  onSnooze,
  onMarkFinished,
}: ReadingRemindersProps) {
  const copy = getTranslations(locale);

  if (links.length === 0) return null;

  return (
    <section
      className="reading-reminders"
      aria-labelledby="reading-reminders-title"
    >
      <div className="reading-reminders-heading">
        <div>
          <h2 id="reading-reminders-title">{copy.readingReminders}</h2>
          <p>{copy.remindersDue}</p>
        </div>
        <span>{links.length}</span>
      </div>
      <ul>
        {links.map((link) => (
          <li key={link.id}>
            <div className="reading-reminder-copy">
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.title}
              </a>
              <span>
                {copy.reminder(
                  formatShortDate(link.vault.reminderAt ?? "", locale),
                )}
              </span>
            </div>
            <div className="reading-reminder-actions">
              <button type="button" onClick={() => onSnooze(link)}>
                {copy.snooze}
              </button>
              <button type="button" onClick={() => onMarkFinished(link)}>
                {copy.done}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
