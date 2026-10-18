import { useMemo, type CSSProperties } from "react";

type ThemeTransitionOverlayProps = {
  /** Tema tujuan */
  to: "light" | "dark";
  onDone: () => void;
};

type Star = { left: number; top: number; size: number; delay: number; dur: number };

// PRNG deterministik supaya posisi bintang konsisten tiap render.
function makeStars(count: number): Star[] {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: count }, () => ({
    left: rand() * 100,
    top: rand() * 100,
    size: 1.5 + rand() * 2.5,
    delay: rand() * 2.4,
    dur: 1.8 + rand() * 2.2,
  }));
}

export default function ThemeTransitionOverlay({
  to,
  onDone,
}: ThemeTransitionOverlayProps) {
  const stars = useMemo(() => makeStars(70), []);

  return (
    <div
      aria-hidden="true"
      className={`theme-scene ${to === "dark" ? "to-dark" : "to-light"}`}
      onAnimationEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.animationName === "theme-scene-leave"
        ) {
          onDone();
        }
      }}
    >
      {/* Langit siang (selalu di bawah) */}
      <div className="scene-sky scene-day">
        <span className="scene-cloud scene-cloud-a" />
        <span className="scene-cloud scene-cloud-b" />
        <span className="scene-cloud scene-cloud-c" />
      </div>

      {/* Langit malam (fade in / out di atas langit siang) */}
      <div className="scene-sky scene-night">
        {stars.map((s, i) => (
          <span
            key={i}
            className="scene-star"
            style={
              {
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.dur}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Matahari turun / naik, bulan naik / turun */}
      <div className="scene-body scene-body-sun">
        <span className="scene-sun" />
      </div>
      <div className="scene-body scene-body-moon">
        <svg className="scene-moon" viewBox="0 0 120 120">
          <defs>
            <mask id="scene-moon-mask">
              <rect width="120" height="120" fill="#fff" />
              <circle cx="82" cy="46" r="40" fill="#000" />
            </mask>
          </defs>
          <circle
            cx="54"
            cy="62"
            r="48"
            fill="#f1f6dc"
            mask="url(#scene-moon-mask)"
          />
        </svg>
      </div>
    </div>
  );
}
