import type { FormEvent } from "react";
import { Feather } from "lucide-react";

type AuthScreenProps = {
  mode: "login" | "register";
  busy: boolean;
  error: string;
  email: string;
  password: string;
  username: string;
  musicUrl: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onMusicUrlChange: (value: string) => void;
  onToggleMode: () => void;
};

function Brand() {
  return (
    <a className="brand auth-brand" href="/" aria-label="Manuknest">
      <span className="brand-icon">
        <Feather size={18} />
      </span>
      <span>Manuknest</span>
    </a>
  );
}

export function AuthScreen({
  mode,
  busy,
  error,
  email,
  password,
  username,
  musicUrl,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onUsernameChange,
  onMusicUrlChange,
  onToggleMode,
}: AuthScreenProps) {
  const isRegister = mode === "register";

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <Brand />
        <div className="auth-copy">
          <h1 id="auth-title">
            {isRegister ? "Buat sarangmu." : "Masuk ke sarang"}
          </h1>
          <p>
            {isRegister
              ? "Daftar untuk mulai menyimpan halaman yang ingin kamu temukan lagi."
              : "Masuk untuk melanjutkan ke koleksi link yang kamu simpan"}
          </p>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          {isRegister && (
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
                placeholder="contoh: tiko_7"
              />
            </label>
          )}
          <label className="field-label">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="nama@email.com"
            />
          </label>
          <label className="field-label">
            Kata sandi
            <input
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={isRegister ? 10 : undefined}
              maxLength={72}
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder={isRegister ? "Minimal 10 karakter" : "Kata sandi akunmu"}
            />
          </label>
          {isRegister && (
            <label className="field-label">
              Lagu profil (opsional)
              <input
                type="url"
                value={musicUrl}
                onChange={(event) => onMusicUrlChange(event.target.value)}
                placeholder="https://music.youtube.com/watch?v=..."
              />
              <small>Tempel link satu lagu dari YouTube Music.</small>
            </label>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="save-button auth-submit"
            type="submit"
            disabled={busy}
          >
            {busy ? "Menghubungkan..." : isRegister ? "Buat akun" : "Masuk"}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button type="button" onClick={onToggleMode}>
            {isRegister ? "Masuk" : "Daftar"}
          </button>
        </p>
      </section>
    </main>
  );
}

type VaultUnlockScreenProps = {
  email: string;
  password: string;
  busy: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPasswordChange: (value: string) => void;
  onSignOut: () => void;
};

export function VaultUnlockScreen({
  email,
  password,
  busy,
  error,
  onSubmit,
  onPasswordChange,
  onSignOut,
}: VaultUnlockScreenProps) {
  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="unlock-title">
        <Brand />
        <div className="auth-copy">
          <div className="eyebrow muted">ARSIP TERENKRIPSI</div>
          <h1 id="unlock-title">Buka arsipmu.</h1>
          <p>
            Masukkan kata sandi untuk membuka link yang tersimpan di perangkat
            ini.
          </p>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field-label">
            Kata sandi akun
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Kata sandi akunmu"
            />
          </label>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="save-button auth-submit"
            type="submit"
            disabled={busy}
          >
            {busy ? "Membuka arsip..." : "Buka arsip"}
          </button>
        </form>
        <p className="auth-switch">
          Akun: <strong>{email}</strong>{" "}
          <button type="button" onClick={onSignOut}>
            Ganti akun
          </button>
        </p>
      </section>
    </main>
  );
}

export function AppLoadingScreen() {
  return (
    <main className="auth-loading" role="status">
      Memuat link tersimpan...
    </main>
  );
}
