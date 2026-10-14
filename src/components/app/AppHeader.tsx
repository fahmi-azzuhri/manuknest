import { Feather, LogOut } from "lucide-react";

type AppHeaderProps = {
  email: string;
  onHome: () => void;
  onSignOut: () => void;
};

export default function AppHeader({
  email,
  onHome,
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
      <button
        className="sign-out-button"
        onClick={onSignOut}
        aria-label={`Keluar dari akun ${email}`}
      >
        <LogOut size={16} />
        <span>Keluar</span>
      </button>
    </header>
  );
}
