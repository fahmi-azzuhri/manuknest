import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, UserRound } from "lucide-react";
import { ApiError, request, type SharedProfile } from "../lib/api";
import ProfileMusicPlayer from "./ProfileMusicPlayer";
import {
  getTranslations,
  localizeMessage,
  translateCategory,
  type Locale,
} from "../lib/i18n";

type SharedProfilePageProps = {
  username: string;
  token: string;
  onBack: () => void;
  locale: Locale;
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function SharedProfilePage({
  username,
  token,
  onBack,
  locale,
}: SharedProfilePageProps) {
  const [profile, setProfile] = useState<SharedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const copy = getTranslations(locale);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    request<SharedProfile>(`/api/profiles/${encodeURIComponent(username)}`, {
      token,
    })
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof ApiError ? cause.message : copy.profileLoadFailed,
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [username, token, reload]);

  return (
    <section className="profile-page shared-profile-page">
      <button className="shared-profile-back" type="button" onClick={onBack}>
        <ArrowLeft size={17} />
        {copy.backExplore}
      </button>
      {loading && (
        <div className="profile-state" role="status">
          {copy.loadingProfile(username)}
        </div>
      )}
      {error && (
        <div className="profile-state error" role="alert">
          <p>{localizeMessage(error, locale)}</p>
          <button
            className="profile-edit-button"
            type="button"
            onClick={() => setReload((current) => current + 1)}
          >
            {copy.retry}
          </button>
        </div>
      )}
      {profile && !loading && !error && (
        <>
          <header className="profile-hero">
            <div className="profile-avatar" aria-hidden="true">
              {profile.username[0]?.toUpperCase() ?? <UserRound size={34} />}
            </div>
            <h1>@{profile.username}</h1>
          </header>
          {profile.musicVideoId && (
            <section
              className="profile-music"
              aria-label={copy.profileSongLabel}
            >
              <ProfileMusicPlayer
                videoId={profile.musicVideoId}
                locale={locale}
              />
            </section>
          )}
          <section
            className="shared-profile-links"
            aria-labelledby="shared-profile-links-title"
          >
            <h2 id="shared-profile-links-title">{copy.sharedLinks}</h2>
            {profile.links.length ? (
              <ul>
                {profile.links.map((link) => (
                  <li key={link.id}>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      <span className="shared-profile-link-copy">
                        <strong>{link.title}</strong>
                        <span>{hostOf(link.url)}</span>
                        {link.tags.length > 0 && (
                          <span>
                            {link.tags
                              .map((tag) => translateCategory(tag, locale))
                              .join(" · ")}
                          </span>
                        )}
                      </span>
                      <ExternalLink size={17} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="shared-profile-empty">
                {copy.noSharedProfileLinks}
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
