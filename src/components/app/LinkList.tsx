import type { ReactNode } from "react";
import { ExternalLink, Heart, Trash2 } from "lucide-react";
import CardStack from "../CardStack";
import type { PopularLink } from "../../lib/api";
import type { LinkVaultData } from "../../lib/vault";
import type { SavedLink } from "./types";
import { formatShortDate, hostOf, tones } from "./types";

type LinkListProps = {
  isHome: boolean;
  isSavedView: boolean;
  isPopularView: boolean;
  links: SavedLink[];
  displayedLinks: SavedLink[];
  popularLinks: PopularLink[];
  popularLoading: boolean;
  popularError: string;
  loadError: string;
  deletingLinkID: number | null;
  likingPopularID: number | null;
  onRetryPopular: () => void;
  onRetryLinks: () => void;
  onOpenHome: () => void;
  onOpenAdd: () => void;
  onOpenArchive: () => void;
  onOpenSharedProfile: (username: string) => void;
  onTogglePopularLike: (link: PopularLink) => void;
  onReadingStatusChange: (
    link: SavedLink,
    status: LinkVaultData["readStatus"],
  ) => void;
  onSnoozeReminder: (link: SavedLink) => void;
  onDeleteLink: (link: SavedLink) => void;
  onResetSearch: () => void;
};

function LinkListState({
  role,
  title,
  children,
  actionLabel,
  onAction,
}: {
  role?: "alert" | "status";
  title: string;
  children?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state" role={role}>
      <h3>{title}</h3>
      {children}
      {actionLabel && onAction && <button onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

function ExploreLinkCards({
  links,
  likingPopularID,
  onOpenProfile,
  onToggleLike,
}: {
  links: PopularLink[];
  likingPopularID: number | null;
  onOpenProfile: (username: string) => void;
  onToggleLike: (link: PopularLink) => void;
}) {
  return (
    <CardStack
      items={links.map((link) => ({
        id: link.id,
        tone: tones[link.id % tones.length],
        icon: hostOf(link.url)[0]?.toUpperCase() ?? "?",
        title: link.title,
        subtitle: hostOf(link.url),
        byline: link.username ? (
          <>
            Dibagikan oleh{" "}
            <button
              className="shared-author-link"
              type="button"
              onClick={() => onOpenProfile(link.username)}
            >
              @{link.username}
            </button>
          </>
        ) : (
          "Dibagikan oleh pengguna Manuknest"
        ),
        aside: (
          <button
            className={link.likedByMe ? "popular-like liked" : "popular-like"}
            aria-label={
              link.isOwner
                ? `Link milikmu, ${link.likeCount} suka`
                : link.likedByMe
                  ? `Hapus sukamu, ${link.likeCount} suka`
                  : `Sukai link, ${link.likeCount} suka`
            }
            aria-pressed={link.likedByMe}
            disabled={link.isOwner || likingPopularID === link.id}
            onClick={() => onToggleLike(link)}
          >
            <Heart
              size={17}
              fill={link.likedByMe ? "currentColor" : "none"}
            />
            <span>{link.likeCount}</span>
          </button>
        ),
        body: (
          <a
            className="stack-url"
            href={link.url}
            target="_blank"
            rel="noreferrer"
          >
            {link.url}
          </a>
        ),
        footer: (
          <>
            {link.tags.map((tag) => (
              <span className="stack-pill soft" key={tag}>
                {tag}
              </span>
            ))}
            <span className="stack-pill">{formatShortDate(link.createdAt)}</span>
            {link.isOwner && (
              <span className="stack-pill soft">Link ini kamu bagikan</span>
            )}
          </>
        ),
      }))}
    />
  );
}

function SavedLinkCards({
  links,
  deletingLinkID,
  onReadingStatusChange,
  onSnoozeReminder,
  onDelete,
}: {
  links: SavedLink[];
  deletingLinkID: number | null;
  onReadingStatusChange: (
    link: SavedLink,
    status: LinkVaultData["readStatus"],
  ) => void;
  onSnoozeReminder: (link: SavedLink) => void;
  onDelete: (link: SavedLink) => void;
}) {
  return (
    <CardStack
      items={links.map((link) => ({
        id: link.id,
        tone: link.color,
        icon: link.initials,
        title: link.title,
        subtitle: link.vault.description.trim(),
        aside: (
          <a
            className="stack-round"
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Buka ${link.title}`}
          >
            <ExternalLink size={16} />
          </a>
        ),
        body: (
          <a
            className="stack-url"
            href={link.href}
            target="_blank"
            rel="noreferrer"
          >
            {link.url}
          </a>
        ),
        footer: (
          <>
            <span className="stack-pill">{formatShortDate(link.createdAt)}</span>
            <span className="stack-pill soft">{link.category}</span>
            <label className="reading-status-control">
              <span className="visually-hidden">
                Status baca untuk {link.title}
              </span>
              <select
                value={link.vault.readStatus}
                onChange={(event) => {
                  const status = event.currentTarget.value;
                  if (
                    status === "unread" ||
                    status === "reading" ||
                    status === "done"
                  ) {
                    onReadingStatusChange(link, status);
                  }
                }}
              >
                <option value="unread">Belum dibaca</option>
                <option value="reading">Sedang dibaca</option>
                <option value="done">Selesai</option>
              </select>
            </label>
            {link.vault.reminderAt && link.vault.readStatus !== "done" && (
              <>
                <span
                  className={
                    Date.parse(link.vault.reminderAt) <= Date.now()
                      ? "stack-pill reminder-date overdue"
                      : "stack-pill reminder-date"
                  }
                >
                  Pengingat {formatShortDate(link.vault.reminderAt)}
                </span>
                <button
                  className="reminder-snooze"
                  type="button"
                  onClick={() => onSnoozeReminder(link)}
                >
                  Tunda 1 hari
                </button>
              </>
            )}
            {link.shared && (
              <span className="stack-pill soft">Dibagikan</span>
            )}
            <div className="stack-actions">
              <button
                className="stack-round danger"
                type="button"
                aria-label={`Hapus ${link.title}`}
                disabled={deletingLinkID !== null}
                onClick={() => onDelete(link)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        ),
      }))}
    />
  );
}

export default function LinkList({
  isHome,
  isSavedView,
  isPopularView,
  links,
  displayedLinks,
  popularLinks,
  popularLoading,
  popularError,
  loadError,
  deletingLinkID,
  likingPopularID,
  onRetryPopular,
  onRetryLinks,
  onOpenHome,
  onOpenAdd,
  onOpenArchive,
  onOpenSharedProfile,
  onTogglePopularLike,
  onReadingStatusChange,
  onSnoozeReminder,
  onDeleteLink,
  onResetSearch,
}: LinkListProps) {
  return (
    <div className="link-list">
      {isPopularView && popularLoading && (
        <div className="empty-state" role="status">
          Memuat link Explore...
        </div>
      )}
      {isPopularView && popularError && (
        <LinkListState
          role="alert"
          title="Link Explore belum bisa dimuat."
          actionLabel="Coba lagi"
          onAction={onRetryPopular}
        >
          <p>{popularError}</p>
        </LinkListState>
      )}
      {!isPopularView && loadError && (
        <LinkListState
          role="alert"
          title="Link belum bisa dimuat."
          actionLabel="Coba lagi"
          onAction={onRetryLinks}
        >
          <p>{loadError}</p>
        </LinkListState>
      )}
      {isPopularView &&
        !popularLoading &&
        !popularError &&
        popularLinks.length === 0 && (
          <LinkListState
            title="Belum ada link yang dibagikan."
            actionLabel="Kembali ke Home"
            onAction={onOpenHome}
          >
            <p>
              Link yang dibagikan akan muncul di sini. Pemiliknya memilih untuk
              menampilkan URL dan judulnya.
            </p>
          </LinkListState>
        )}
      {isPopularView &&
        !popularLoading &&
        !popularError &&
        popularLinks.length > 0 && (
          <ExploreLinkCards
            links={popularLinks}
            likingPopularID={likingPopularID}
            onOpenProfile={onOpenSharedProfile}
            onToggleLike={onTogglePopularLike}
          />
        )}
      {!isPopularView && displayedLinks.length > 0 && (
        <SavedLinkCards
          links={displayedLinks}
          deletingLinkID={deletingLinkID}
          onReadingStatusChange={onReadingStatusChange}
          onSnoozeReminder={onSnoozeReminder}
          onDelete={onDeleteLink}
        />
      )}
      {isSavedView &&
        displayedLinks.length === 0 &&
        links.length > 0 &&
        !loadError && (
          <LinkListState
            title="Belum ketemu, nih."
            actionLabel="Reset pencarian"
            onAction={onResetSearch}
          >
            <p>Coba kata kunci lain atau pilih kategori berbeda.</p>
          </LinkListState>
        )}
      {!isPopularView && links.length === 0 && !loadError && (
        <LinkListState
          title={isSavedView ? "Belum ada link tersimpan." : "Belum ada link terbaru."}
          actionLabel="Simpan link pertama"
          onAction={onOpenAdd}
        >
          <p>
            Tempel URL, lalu pilih kategori dan tambahkan catatan kalau perlu.
          </p>
        </LinkListState>
      )}
      {isHome && links.length > 3 && (
        <button
          className="text-button recent-links-more"
          onClick={onOpenArchive}
        >
          Buka semua {links.length} link
        </button>
      )}
    </div>
  );
}
