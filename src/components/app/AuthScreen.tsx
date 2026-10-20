import type { FormEvent } from "react";
import { Feather } from "lucide-react";
import { getTranslations, localizeMessage, type Locale } from "../../lib/i18n";
import LanguageSwitch from "./LanguageSwitch";

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
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
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
  locale,
  onLocaleChange,
}: AuthScreenProps) {
  const copy = getTranslations(locale);
  const isRegister = mode === "register";

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <Brand />
        <div className="auth-copy">
          <h1 id="auth-title">
            {isRegister ? copy.registerTitle : copy.loginTitle}
          </h1>
          <p>{isRegister ? copy.registerDescription : copy.loginDescription}</p>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          {isRegister && (
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
            </label>
          )}
          <label className="field-label">
            {copy.email}
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder={copy.emailPlaceholder}
            />
          </label>
          <label className="field-label">
            {copy.password}
            <input
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={isRegister ? 10 : undefined}
              maxLength={72}
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder={
                isRegister
                  ? copy.minimumPasswordPlaceholder
                  : copy.accountPasswordPlaceholder
              }
            />
          </label>
          {isRegister && (
            <label className="field-label">
              {copy.profileSong} {copy.optional}
              <input
                type="url"
                value={musicUrl}
                onChange={(event) => onMusicUrlChange(event.target.value)}
                placeholder="https://music.youtube.com/watch?v=..."
              />
              <small>{copy.youtubeMusicHint}</small>
            </label>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {localizeMessage(error, locale)}
            </p>
          )}
          <button
            className="save-button auth-submit"
            type="submit"
            disabled={busy}
          >
            {busy
              ? copy.connecting
              : isRegister
              ? copy.createAccount
              : copy.login}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? copy.alreadyAccount : copy.noAccount}{" "}
          <button type="button" onClick={onToggleMode}>
            {isRegister ? copy.login : copy.signUp}
          </button>
        </p>
        <div className="auth-language-switch">
          <LanguageSwitch locale={locale} onLocaleChange={onLocaleChange} />
        </div>
      </section>
    </main>
  );
}

export function AppLoadingScreen({ locale }: { locale: Locale }) {
  const copy = getTranslations(locale);
  return (
    <main className="auth-loading" role="status">
      {copy.loadingSavedLinks}
    </main>
  );
}
