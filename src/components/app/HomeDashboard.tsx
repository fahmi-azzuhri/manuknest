import type { FormEvent } from "react";
import { Bookmark, Folder, Plus } from "lucide-react";
import Mascot from "../Mascot";
import type { SavedLink } from "./types";
import Notice from "./Notice";

function MascotHero({
  savedCount,
  speech,
}: {
  savedCount: number;
  speech: string;
}) {
  return (
    <section className="hero">
      <div className="mascot-stage">
        <Mascot mood="happy" savedCount={savedCount} speech={speech} />
      </div>
    </section>
  );
}

function QuickSaveForm({
  url,
  onUrlChange,
  onSubmit,
}: {
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
        placeholder="Tempel link yang ingin kamu simpan..."
        aria-label="URL yang ingin disimpan"
      />
      <button className="save-button" type="submit">
        Simpan
      </button>
    </form>
  );
}

export function HomeStatistics({ links }: { links: SavedLink[] }) {
  const categoryCount = new Set(links.map((link) => link.category)).size;

  return (
    <section className="stats-row">
      <div className="stat-card">
        <div className="stat-label">
          TOTAL KOLEKSI <Bookmark size={15} />
        </div>
        <div className="stat-bottom">
          <strong>{links.length}</strong>
          <span>link tersimpan</span>
          <div className="stat-art art-bookmark">
            <Bookmark size={28} />
          </div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">
          KATEGORI <Folder size={15} />
        </div>
        <div className="stat-bottom">
          <strong>{categoryCount}</strong>
          <span>topik dijelajahi</span>
          <div className="stat-art art-folder">
            <Folder size={29} />
          </div>
        </div>
      </div>
      <div className="stat-card encouragement">
        <div>
          <span className="mini-label">PESAN DARI TIKO</span>
          <p>Pelan-pelan aja. Ide bagus layak disimpan. 🌱</p>
        </div>
      </div>
    </section>
  );
}

export function HomeReminder() {
  return (
    <section className="gentle-reminder">
      <div className="reminder-star">✳</div>
      <div>
        <strong>Sarangnya link-link penting lo!</strong>
        <p>Temukan lagi halaman yang kamu simpan kapan pun.</p>
      </div>
      <span className="reminder-plant">⌁</span>
    </section>
  );
}

type HomeDashboardProps = {
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
      <MascotHero savedCount={links.length} speech={mascotSpeech} />
      <QuickSaveForm
        url={url}
        onUrlChange={onUrlChange}
        onSubmit={onOpenAdd}
      />
      {notice && (
        <Notice
          message={notice}
          isError={noticeIsError}
          onClose={onCloseNotice}
        />
      )}
      <HomeStatistics links={links} />
    </>
  );
}
