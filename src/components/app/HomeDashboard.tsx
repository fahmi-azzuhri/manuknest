import type { FormEvent } from "react";
import { Bookmark, Folder, Plus } from "lucide-react";
import Mascot from "../Mascot";
import type { SavedLink } from "./types";
import Notice from "./Notice";
import { getTranslations, type Locale } from "../../lib/i18n";

function MascotHero({
  savedCount,
  speech,
  locale,
}: {
  savedCount: number;
  speech: string;
  locale: Locale;
}) {
  return (
    <section className="hero">
      <div className="mascot-stage">
        <Mascot
          mood="happy"
          savedCount={savedCount}
          speech={speech}
          locale={locale}
        />
      </div>
    </section>
  );
}

function QuickSaveForm({
  locale,
  url,
  onUrlChange,
  onSubmit,
}: {
  locale: Locale;
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: (url: string) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit(String(formData.get("url") ?? ""));
  }

  return (
    <form className="quick-save" onSubmit={submit}>
      <div className="quick-save-icon" aria-hidden="true">
        <Plus size={18} />
      </div>
      <input
        name="url"
        value={url}
        onChange={(event) => onUrlChange(event.target.value)}
        placeholder={getTranslations(locale).saveLinkPlaceholder}
        aria-label={getTranslations(locale).linkUrl}
      />
      <button className="save-button" type="submit">
        {getTranslations(locale).save}
      </button>
    </form>
  );
}

export function HomeStatistics({
  links,
  locale,
}: {
  links: SavedLink[];
  locale: Locale;
}) {
  const copy = getTranslations(locale);
  const categoryCount = new Set(links.map((link) => link.category)).size;

  return (
    <section className="stats-row">
      <div className="stat-card">
        <div className="stat-label">
          {copy.totalCollection} <Bookmark size={15} />
        </div>
        <div className="stat-bottom">
          <strong>{links.length}</strong>
          <span>{copy.savedLinks}</span>
          <div className="stat-art art-bookmark">
            <Bookmark size={28} />
          </div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">
          {copy.categories} <Folder size={15} />
        </div>
        <div className="stat-bottom">
          <strong>{categoryCount}</strong>
          <span>{copy.exploredTopics}</span>
          <div className="stat-art art-folder">
            <Folder size={29} />
          </div>
        </div>
      </div>
      <div className="stat-card encouragement">
        <div>
          <span className="mini-label">{copy.tikoMessage}</span>
          <p>{copy.tikoEncouragement}</p>
        </div>
      </div>
    </section>
  );
}

export function HomeReminder({ locale }: { locale: Locale }) {
  const copy = getTranslations(locale);
  return (
    <section className="gentle-reminder">
      <div className="reminder-star">✳</div>
      <div>
        <strong>{copy.nestImportantLinks}</strong>
        <p>{copy.findSavedPages}</p>
      </div>
      <span className="reminder-plant">⌁</span>
    </section>
  );
}

type HomeDashboardProps = {
  locale: Locale;
  links: SavedLink[];
  url: string;
  mascotSpeech: string;
  notice: string;
  noticeIsError: boolean;
  onUrlChange: (value: string) => void;
  onOpenAdd: (url: string) => void;
  onCloseNotice: () => void;
};

export default function HomeDashboard({
  locale,
  links,
  url,
  mascotSpeech,
  notice,
  noticeIsError,
  onUrlChange,
  onOpenAdd,
  onCloseNotice,
}: HomeDashboardProps) {
  return (
    <>
      <MascotHero
        savedCount={links.length}
        speech={mascotSpeech}
        locale={locale}
      />
      <QuickSaveForm
        locale={locale}
        url={url}
        onUrlChange={onUrlChange}
        onSubmit={onOpenAdd}
      />
      {notice && (
        <Notice
          message={notice}
          isError={noticeIsError}
          onClose={onCloseNotice}
          locale={locale}
        />
      )}
      <HomeStatistics links={links} locale={locale} />
    </>
  );
}
