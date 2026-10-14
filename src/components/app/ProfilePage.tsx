import type { FormEvent } from "react";
import { CalendarDays, Pencil, UserRound } from "lucide-react";
import ProfileMusicPlayer from "../ProfileMusicPlayer";
import type { ProfileStats, User } from "../../lib/api";
import { formatAccountDate } from "./types";

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
};

function ProfileHeader({
  username,
  onEdit,
  editOpen,
}: {
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
        {username ? `@${username}` : "Atur username profil"}
      </h1>
      <button
        className="profile-edit-button"
        type="button"
        onClick={onEdit}
        aria-expanded={editOpen}
        aria-controls="profile-edit-form"
      >
        <Pencil size={16} />
        Edit profil
      </button>
    </header>
  );
}

function ProfileEditForm({
  username,
  musicUrl,
  saving,
  error,
  onSubmit,
  onUsernameChange,
  onMusicUrlChange,
  onCancel,
}: {
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
      <h2>Edit profil</h2>
      <label className="field-label">
        Username
        <input
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={24}
          pattern="[A-Za-z0-9][A-Za-z0-9_]{2,23}"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
        />
        <small>
          Username harus unik. Gunakan 3-24 huruf, angka, atau garis bawah.
        </small>
      </label>
      <label className="field-label">
        Lagu YouTube Music
        <input
          type="url"
          value={musicUrl}
          onChange={(event) => onMusicUrlChange(event.target.value)}
          placeholder="https://music.youtube.com/watch?v=..."
        />
        <small>
          Opsional. Tempel link satu lagu; kosongkan untuk menghapus pemutar
          musik.
        </small>
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
          Batal
        </button>
        <button className="save-button" type="submit" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan profil"}
        </button>
      </div>
    </form>
  );
}

function ProfileStatistics({
  stats,
}: {
  stats: ProfileStats;
}) {
  return (
    <dl className="profile-stats" aria-label="Statistik profil">
      <div>
        <dt>Dibagikan</dt>
        <dd>{stats.sharedLinks}</dd>
      </div>
      <div>
        <dt>Menyukai</dt>
        <dd>{stats.likesGiven}</dd>
      </div>
      <div>
        <dt>Disukai</dt>
        <dd>{stats.likesReceived}</dd>
      </div>
    </dl>
  );
}

function ProfileDetails({ user }: { user: User }) {
  return (
    <dl className="profile-details">
      <div>
        <dt>Email</dt>
        <dd>{user.email}</dd>
      </div>
      <div>
        <dt>
          <CalendarDays size={15} /> Bergabung
        </dt>
        <dd>{formatAccountDate(user.createdAt)}</dd>
      </div>
    </dl>
  );
}

function ProfileMusic({ videoId }: { videoId: string }) {
  return (
    <section className="profile-music" aria-labelledby="music-title">
      {videoId ? (
        <ProfileMusicPlayer videoId={videoId} />
      ) : (
        <p>
          Belum ada lagu profil. Tambahkan satu link lagu YouTube Music lewat
          Edit profil.
        </p>
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
}: ProfilePageProps) {
  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <ProfileHeader
        username={user.username}
        onEdit={onEdit}
        editOpen={editOpen}
      />
      {saveNotice && (
        <p className="profile-feedback" role="status">
          {saveNotice}
        </p>
      )}
      {editOpen && (
        <ProfileEditForm
          username={username}
          musicUrl={musicUrl}
          saving={saving}
          error={saveError}
          onSubmit={onSubmit}
          onUsernameChange={onUsernameChange}
          onMusicUrlChange={onMusicUrlChange}
          onCancel={onCancelEdit}
        />
      )}
      {loading && (
        <div className="profile-state" role="status">
          Memuat statistik profil...
        </div>
      )}
      {error && (
        <div className="profile-state error" role="alert">
          <p>{error}</p>
          <button
            className="profile-edit-button"
            type="button"
            onClick={reload}
          >
            Coba lagi
          </button>
        </div>
      )}
      {stats && !error && <ProfileStatistics stats={stats} />}
      <ProfileDetails user={user} />
      <ProfileMusic videoId={user.musicVideoId} />
    </section>
  );
}
