import type { ReactNode } from "react";
import { useState } from "react";
import { ExternalLink, Heart, Trash2 } from "lucide-react";
import CardStack from "../CardStack";
import type { PopularLink } from "../../lib/api";
import type { LinkVaultData } from "../../lib/vault";
import type { SavedLink } from "./types";
import { formatShortDate, hostOf, tones } from "./types";
import {
  getTranslations,
  localizeMessage,
  translateCategory,
  type Locale,
} from "../../lib/i18n";

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
  locale: Locale;
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
      {actionLabel && onAction && (
        <button onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}

function SavedLinkIcon({ link }: { link: SavedLink }) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const showPreview = Boolean(link.vault.previewImageUrl) && !previewFailed;
  const showFavicon = Boolean(link.vault.faviconUrl) && !faviconFailed;

  return (
    <span
      className={
        showPreview
          ? "link-preview-mark with-cover"
          : "link-preview-mark without-cover"
      }
    >
      {showPreview && (
        <img
          className="link-preview-cover"
          src={link.vault.previewImageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setPreviewFailed(true)}
        />
      )}
      <span
        className={
          showPreview
            ? "link-preview-favicon is-overlay"
            : "link-preview-favicon"
        }
      >
        {showFavicon ? (
          <img
            src={link.vault.faviconUrl}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFaviconFailed(true)}
          />
        ) : (
          <span>{link.initials}</span>
        )}
      </span>
    </span>
  );
}

function ExploreLinkCards({
  locale,
  links,
  likingPopularID,
  onOpenProfile,
  onToggleLike,
}: {
  locale: Locale;
  links: PopularLink[];
  likingPopularID: number | null;
  onOpenProfile: (username: string) => void;
  onToggleLike: (link: PopularLink) => void;
}) {
  const copy = getTranslations(locale);

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
            {copy.exploreSharedBy}{" "}
            <button
              className="shared-author-link"
              type="button"
              onClick={() => onOpenProfile(link.username)}
            >
              @{link.username}
            </button>
          </>
        ) : (
          copy.sharedByManuknest
        ),
        aside: (
          <button
            className={link.likedByMe ? "popular-like liked" : "popular-like"}
            aria-label={
              link.isOwner
                ? copy.ownLink(link.likeCount)
                : link.likedByMe
                ? copy.removeLike(link.likeCount)
                : copy.likeLink(link.likeCount)
            }
            aria-pressed={link.likedByMe}
            disabled={link.isOwner || likingPopularID === link.id}
            onClick={() => onToggleLike(link)}
          >
            <Heart size={17} fill={link.likedByMe ? "currentColor" : "none"} />
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
                {translateCategory(tag, locale)}
              </span>
            ))}
            <span className="stack-pill">
              {formatShortDate(link.createdAt, locale)}
            </span>
            {link.isOwner && (
              <span className="stack-pill soft">{copy.ownSharedLink}</span>
            )}
          </>
        ),
      }))}
    />
  );
}

function SavedLinkCards({
  locale,
  links,
  deletingLinkID,
  onReadingStatusChange,
  onSnoozeReminder,
  onDelete,
}: {
  locale: Locale;
  links: SavedLink[];
  deletingLinkID: number | null;
  onReadingStatusChange: (
    link: SavedLink,
    status: LinkVaultData["readStatus"],
  ) => void;
  onSnoozeReminder: (link: SavedLink) => void;
  onDelete: (link: SavedLink) => void;
}) {
  const copy = getTranslations(locale);

  return (
    <CardStack
      items={links.map((link) => ({
        id: link.id,
        tone: link.color,
        icon: <SavedLinkIcon link={link} />,
        iconClassName: "stack-link-preview",
        title: link.title,
        subtitle: hostOf(link.href),
        aside: (
          <a
            className="stack-round"
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={copy.openLink(link.title)}
          >
            <ExternalLink size={16} />
          </a>
        ),
        body: (
          <>
            {link.vault.description.trim() && (
              <p className="stack-note">{link.vault.description}</p>
            )}
            <a
              className="stack-url"
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.url}
            </a>
          </>
        ),
        footer: (
          <>
            <span className="stack-pill">
              {formatShortDate(link.createdAt, locale)}
            </span>
            <span className="stack-pill soft">
              {translateCategory(link.category, locale)}
            </span>
            <label className="reading-status-control">
              <span className="visually-hidden">
                {copy.readStatus(link.title)}
              </span>
              <select
                value={link.vault.readStatus}
                onChange={(event) => {
                  const status = event.currentTarget.value;
                  if (status === "unread" || status === "done") {
                    onReadingStatusChange(link, status);
                  }
                }}
              >
                <option value="unread">{copy.unread}</option>
                <option value="done">{copy.done}</option>
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
                  {copy.readingReminder}{" "}
                  {copy.reminder(
                    formatShortDate(link.vault.reminderAt, locale),
                  )}
                </span>
                <button
                  className="reminder-snooze"
                  type="button"
                  onClick={() => onSnoozeReminder(link)}
                >
                  {copy.snooze}
                </button>
              </>
            )}
            {link.shared && (
              <span className="stack-pill soft">{copy.shared}</span>
            )}
            <div className="stack-actions">
              <button
                className="stack-round danger"
                type="button"
                aria-label={copy.deleteLinkLabel(link.title)}
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
  locale,
}: LinkListProps) {
  const copy = getTranslations(locale);

  return (
    <div className="link-list">
      {isPopularView && popularLoading && (
        <div className="empty-state" role="status">
          {copy.loadingExplore}
        </div>
      )}
      {isPopularView && popularError && (
        <LinkListState
          role="alert"
          title={localizeMessage("Link Explore belum bisa dimuat.", locale)}
          actionLabel={copy.retry}
          onAction={onRetryPopular}
        >
          <p>{localizeMessage(popularError, locale)}</p>
        </LinkListState>
      )}
      {!isPopularView && loadError && (
        <LinkListState
          role="alert"
          title={copy.linkLoadFailed}
          actionLabel={copy.retry}
          onAction={onRetryLinks}
        >
          <p>{localizeMessage(loadError, locale)}</p>
        </LinkListState>
      )}
      {isPopularView &&
        !popularLoading &&
        !popularError &&
        popularLinks.length === 0 && (
          <LinkListState
            title={copy.noSharedLinks}
            actionLabel={copy.backHome}
            onAction={onOpenHome}
          >
            <p>{copy.sharedLinksHint}</p>
          </LinkListState>
        )}
      {isPopularView &&
        !popularLoading &&
        !popularError &&
        popularLinks.length > 0 && (
          <ExploreLinkCards
            locale={locale}
            links={popularLinks}
            likingPopularID={likingPopularID}
            onOpenProfile={onOpenSharedProfile}
            onToggleLike={onTogglePopularLike}
          />
        )}
      {!isPopularView && displayedLinks.length > 0 && (
        <SavedLinkCards
          locale={locale}
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
            title={copy.noResults}
            actionLabel={copy.retry}
            onAction={onRetryPopular}
          >
            <p>{copy.searchHint}</p>
          </LinkListState>
        )}
      {!isPopularView && links.length === 0 && !loadError && (
        <LinkListState
          title={isSavedView ? copy.noSavedLinks : copy.noRecentLinks}
          actionLabel={copy.saveFirstLink}
          onAction={onOpenAdd}
        >
          <p>{copy.saveFirstHint}</p>
        </LinkListState>
      )}
      {isHome && links.length > 3 && (
        <button
          className="text-button recent-links-more"
          onClick={onOpenArchive}
        >
          {copy.openAllLinks(links.length)}
        </button>
      )}
    </div>
  );
}
