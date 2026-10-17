import { Feather, LogOut, Moon, Sun } from "lucide-react";

type AppHeaderProps = {
  email: string;
  theme: "light" | "dark";
  onHome: () => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
};

export default function AppHeader({
  email,
  theme,
  onHome,
  onToggleTheme,
  onSignOut,
}: AppHeaderProps) {
  return (
    <header className="topbar">
      <a
        className="brand"
        href="#"
        onClick={(event) => {
          event.preventDefault();
          onHome();
        }}
      >
        <span className="brand-icon">
          <Feather size={18} />
        </span>
        <span>Manuknest</span>
      </a>
      <div className="topbar-actions">
        <button
          className="icon-button theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Aktifkan tema ${theme === "dark" ? "terang" : "gelap"}`}
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className="sign-out-button"
          onClick={onSignOut}
          aria-label={`Keluar dari akun ${email}`}
        >
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
}
