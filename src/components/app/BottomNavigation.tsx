import { Bookmark, House, Telescope, UserRound } from "lucide-react";

export type AppNavigationItem = "Home" | "Saved" | "Explore" | "Profile";

const navigationItems = [
  { name: "Home", icon: House },
  { name: "Saved", icon: Bookmark },
  { name: "Explore", icon: Telescope },
  { name: "Profile", icon: UserRound },
] as const;

type BottomNavigationProps = {
  activeItem: AppNavigationItem;
  onNavigate: (item: AppNavigationItem) => void;
};

export default function BottomNavigation({
  activeItem,
  onNavigate,
}: BottomNavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {navigationItems.map(({ name, icon: Icon }) => (
        <button
          key={name}
          className={activeItem === name ? "nav-item active" : "nav-item"}
          aria-label={name}
          aria-current={activeItem === name ? "page" : undefined}
          onClick={() => onNavigate(name)}
        >
          <Icon size={17} />
          <span>{name}</span>
        </button>
      ))}
    </nav>
  );
}
