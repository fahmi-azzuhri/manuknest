import type { SavedLink } from "./types";
import { formatShortDate } from "./types";

type ReadingRemindersProps = {
  links: SavedLink[];
  onSnooze: (link: SavedLink) => void;
  onMarkFinished: (link: SavedLink) => void;
};

export default function ReadingReminders({
  links,
  onSnooze,
  onMarkFinished,
}: ReadingRemindersProps) {
  if (links.length === 0) return null;

  return (
    <section className="reading-reminders" aria-labelledby="reading-reminders-title">
      <div className="reading-reminders-heading">
        <div>
          <h2 id="reading-reminders-title">Pengingat bacaan</h2>
          <p>Link yang sudah waktunya kamu buka lagi.</p>
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
              <span>Pengingat {formatShortDate(link.vault.reminderAt ?? "")}</span>
            </div>
            <div className="reading-reminder-actions">
              <button type="button" onClick={() => onSnooze(link)}>
                Tunda 1 hari
              </button>
              <button type="button" onClick={() => onMarkFinished(link)}>
                Selesai
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
