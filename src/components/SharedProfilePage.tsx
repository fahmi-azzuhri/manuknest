import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, UserRound } from "lucide-react";
import { ApiError, request, type SharedProfile } from "../lib/api";
import ProfileMusicPlayer from "./ProfileMusicPlayer";

type SharedProfilePageProps = {
  username: string;
  token: string;
  onBack: () => void;
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
}: SharedProfilePageProps) {
  const [profile, setProfile] = useState<SharedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

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
          cause instanceof ApiError
            ? cause.message
            : "Profil belum bisa dimuat. Coba lagi.",
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
        Kembali ke Explore
      </button>
      {loading && (
        <div className="profile-state" role="status">
          Memuat profil @{username}...
        </div>
      )}
      {error && (
        <div className="profile-state error" role="alert">
          <p>{error}</p>
          <button
            className="profile-edit-button"
            type="button"
            onClick={() => setReload((current) => current + 1)}
          >
            Coba lagi
          </button>
        </div>
      )}
      {profile && !loading && !error && (
        <>
          <header className="profile-hero">
            <div className="profile-avatar" aria-hidden="true">
              {profile.username[0]?.toUpperCase() ?? (
                <UserRound size={34} />
              )}
            </div>
            <h1>@{profile.username}</h1>
          </header>
          {profile.musicVideoId && (
            <section className="profile-music" aria-label="Lagu profil">
              <ProfileMusicPlayer videoId={profile.musicVideoId} />
            </section>
          )}
          <section className="shared-profile-links" aria-labelledby="shared-profile-links-title">
            <h2 id="shared-profile-links-title">Link yang dibagikan</h2>
            {profile.links.length ? (
              <ul>
                {profile.links.map((link) => (
                  <li key={link.id}>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      <span className="shared-profile-link-copy">
                        <strong>{link.title}</strong>
                        <span>{hostOf(link.url)}</span>
                      </span>
                      <ExternalLink size={17} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="shared-profile-empty">
                Belum ada link yang dibagikan.
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
