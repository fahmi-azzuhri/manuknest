import { Feather, LogOut, Moon, Sun } from "lucide-react";

type AppHeaderProps = {
  email: string;
  theme: "light" | "dark";
  onHome: () => void;
  onToggleTheme: (origin: { x: number; y: number }) => void;
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
          onClick={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            onToggleTheme({
              x: bounds.left + bounds.width / 2,
              y: bounds.top + bounds.height / 2,
            });
          }}
          aria-label={`Aktifkan tema ${theme === "dark" ? "terang" : "gelap"}`}
          aria-pressed={theme === "dark"}
          data-theme={theme}
        >
          <span className="theme-toggle-icon theme-toggle-sun" aria-hidden="true">
            <Sun size={19} />
          </span>
          <span className="theme-toggle-icon theme-toggle-moon" aria-hidden="true">
            <Moon size={18} />
          </span>
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
