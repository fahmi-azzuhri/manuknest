import { Bookmark, House, Telescope, UserRound } from "lucide-react";
import { getTranslations, type Locale } from "../../lib/i18n";

export type AppNavigationItem = "Home" | "Saved" | "Explore" | "Profile";

const navigationItems = [
  { name: "Home", icon: House },
  { name: "Saved", icon: Bookmark },
  { name: "Explore", icon: Telescope },
  { name: "Profile", icon: UserRound },
] as const;

type BottomNavigationProps = {
  locale: Locale;
  activeItem: AppNavigationItem;
  onNavigate: (item: AppNavigationItem) => void;
};

export default function BottomNavigation({
  locale,
  activeItem,
  onNavigate,
}: BottomNavigationProps) {
  const copy = getTranslations(locale);
  const labels = {
    Home: copy.home,
    Saved: copy.saved,
    Explore: copy.explore,
    Profile: copy.profile,
  };

  return (
    <nav className="bottom-nav" aria-label={copy.mainNavigation}>
      {navigationItems.map(({ name, icon: Icon }) => (
        <button
          key={name}
          className={activeItem === name ? "nav-item active" : "nav-item"}
          aria-label={labels[name]}
          aria-current={activeItem === name ? "page" : undefined}
          onClick={() => onNavigate(name)}
        >
          <Icon size={17} />
          <span>{labels[name]}</span>
        </button>
      ))}
    </nav>
  );
}
