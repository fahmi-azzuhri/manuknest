import type { FormEvent } from "react";
import ImportExportSection from "./ImportExportSection";
import { CalendarDays, Pencil, UserRound } from "lucide-react";
import ProfileMusicPlayer from "../ProfileMusicPlayer";
import type { ProfileStats, User } from "../../lib/api";
import { formatAccountDate } from "./types";
import { getTranslations, localizeMessage, type Locale } from "../../lib/i18n";

type ProfilePageProps = {
  user: User;
  stats: ProfileStats | null;
  loading: boolean;
  error: string;
  reload: () => void;
  saveNotice: string;
  editOpen: boolean;
  username: string;
  musicUrl: string;
  saving: boolean;
  saveError: string;
  onEdit: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUsernameChange: (value: string) => void;
  onMusicUrlChange: (value: string) => void;
  onCancelEdit: () => void;
  locale: Locale;
  dataStatus: string;
  onExportData: () => void;
  onImportData: (file: File) => void;
};

type ProfileCopy = ReturnType<typeof getTranslations>;

function ProfileHeader({
  copy,
  username,
  onEdit,
  editOpen,
}: {
  copy: ProfileCopy;
  username: string;
  onEdit: () => void;
  editOpen: boolean;
}) {
  return (
    <header className="profile-hero">
      <div className="profile-avatar" aria-hidden="true">
        {username[0]?.toUpperCase() ?? <UserRound size={34} />}
      </div>
      <h1 id="profile-title">
        {username ? `@${username}` : copy.setProfileUsername}
      </h1>
      <button
        className="profile-edit-button"
        type="button"
        onClick={onEdit}
        aria-expanded={editOpen}
        aria-controls="profile-edit-form"
      >
        <Pencil size={16} />
        {copy.editProfile}
      </button>
    </header>
  );
}

function ProfileEditForm({
  copy,
  username,
  musicUrl,
  saving,
  error,
  onSubmit,
  onUsernameChange,
  onMusicUrlChange,
  onCancel,
}: {
  copy: ProfileCopy;
  username: string;
  musicUrl: string;
  saving: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUsernameChange: (value: string) => void;
  onMusicUrlChange: (value: string) => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="profile-edit-form"
      id="profile-edit-form"
      onSubmit={onSubmit}
    >
      <h2>{copy.editProfile}</h2>
      <label className="field-label">
        {copy.username}
        <input
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={24}
          pattern="[A-Za-z0-9][A-Za-z0-9_]{2,23}"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder={copy.usernamePlaceholder}
        />
        <small>{copy.usernameHint}</small>
      </label>
      <label className="field-label">
        {copy.youtubeMusic}
        <input
          type="url"
          value={musicUrl}
          onChange={(event) => onMusicUrlChange(event.target.value)}
          placeholder="https://music.youtube.com/watch?v=..."
        />
        <small>{copy.musicHint}</small>
      </label>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <div className="profile-edit-actions">
        <button
          className="profile-edit-button"
          type="button"
          onClick={onCancel}
        >
          {copy.cancel}
        </button>
        <button className="save-button" type="submit" disabled={saving}>
          {saving ? copy.savingProfile : copy.saveProfile}
        </button>
      </div>
    </form>
  );
}

function ProfileStatistics({
  copy,
  stats,
}: {
  copy: ProfileCopy;
  stats: ProfileStats;
}) {
  return (
    <dl className="profile-stats" aria-label={copy.profileStats}>
      <div>
        <dt>{copy.sharedCount}</dt>
        <dd>{stats.sharedLinks}</dd>
      </div>
      <div>
        <dt>{copy.likesGiven}</dt>
        <dd>{stats.likesGiven}</dd>
      </div>
      <div>
        <dt>{copy.likesReceived}</dt>
        <dd>{stats.likesReceived}</dd>
      </div>
    </dl>
  );
}

function ProfileDetails({ user, locale }: { user: User; locale: Locale }) {
  const copy = getTranslations(locale);
  return (
    <dl className="profile-details">
      <div>
        <dt>Email</dt>
        <dd>{user.email}</dd>
      </div>
      <div>
        <dt>
          <CalendarDays size={15} /> {copy.joined}
        </dt>
        <dd>{formatAccountDate(user.createdAt, locale)}</dd>
      </div>
    </dl>
  );
}

function ProfileMusic({
  videoId,
  locale,
}: {
  videoId: string;
  locale: Locale;
}) {
  const copy = getTranslations(locale);
  return (
    <section className="profile-music" aria-labelledby="music-title">
      {videoId ? (
        <ProfileMusicPlayer videoId={videoId} locale={locale} />
      ) : (
        <p>{copy.noProfileSong}</p>
      )}
    </section>
  );
}

export default function ProfilePage({
  user,
  stats,
  loading,
  error,
  reload,
  saveNotice,
  editOpen,
  username,
  musicUrl,
  saving,
  saveError,
  onEdit,
  onSubmit,
  onUsernameChange,
  onMusicUrlChange,
  onCancelEdit,
  locale,
  dataStatus,
  onExportData,
  onImportData,
}: ProfilePageProps) {
  const copy = getTranslations(locale);

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <ProfileHeader
        copy={copy}
        username={user.username}
        onEdit={onEdit}
        editOpen={editOpen}
      />
      {saveNotice && (
        <p className="profile-feedback" role="status">
          {localizeMessage(saveNotice, locale)}
        </p>
      )}
      {editOpen && (
        <ProfileEditForm
          copy={copy}
          username={username}
          musicUrl={musicUrl}
          saving={saving}
          error={localizeMessage(saveError, locale)}
          onSubmit={onSubmit}
          onUsernameChange={onUsernameChange}
          onMusicUrlChange={onMusicUrlChange}
          onCancel={onCancelEdit}
        />
      )}
      {loading && (
        <div className="profile-state" role="status">
          {copy.loadingProfileStats}
        </div>
      )}
      {error && (
        <div className="profile-state error" role="alert">
          <p>{localizeMessage(error, locale)}</p>
          <button
            className="profile-edit-button"
            type="button"
            onClick={reload}
          >
            {copy.retry}
          </button>
        </div>
      )}
      {stats && !error && <ProfileStatistics copy={copy} stats={stats} />}
      <ProfileDetails user={user} locale={locale} />
      <ProfileMusic videoId={user.musicVideoId} locale={locale} />
      <ImportExportSection
        locale={locale}
        status={dataStatus}
        onExport={onExportData}
        onImport={onImportData}
      />
    </section>
  );
}
