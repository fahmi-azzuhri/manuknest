import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { getTranslations, type Locale } from "../lib/i18n";

const IMG = {
  nest: "/tiko/nest-idle.webp",
  nestEmpty: "/tiko/nest-empty.webp",
  nestFront: "/tiko/nest-front.webp",
  fly1: "/tiko/fly-1.webp",
  fly2: "/tiko/fly-2.webp",
};
const FLY_ASPECT = 360 / 394;

type Props = {
  mood?: "happy" | "sleepy" | "peek";
  small?: boolean;
  speech?: string;
  savedCount?: number;
  locale?: Locale;
};
type Phase = "nest" | "flying" | "landed";
type Origin = { x: number; y: number; w: number; h: number };
type Flyer = Origin;

const FLY_MS = 9000;
const LANDED_MS = 2400;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 *
  (2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

function buildKeyframes(o: Origin): Keyframe[] {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const sx = window.scrollX;
  const sy = window.scrollY;
  const minX = sx + 8;
  const maxX = Math.max(minX, sx + vw - o.w * 1.12 - 8);
  const minY = sy + 8;
  const maxY = Math.max(minY, sy + vh - o.h * 1.12 - 84);
  const far = Math.min(vw, vh) * 0.38;

  const pts = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: -o.h * 0.08 },
    { x: 0, y: -o.h * 0.35 },
    { x: 0, y: -o.h * 0.85 },
  ];
  let last = pts[pts.length - 1];
  for (let i = 0; i < 7; i++) {
    let c = last;
    for (let t = 0; t < 14; t++) {
      c = {
        x: minX + Math.random() * (maxX - minX) - o.x,
        y: minY + Math.random() * (maxY - minY) - o.y,
      };
      if (Math.hypot(c.x - last.x, c.y - last.y) >= far) break;
    }
    pts.push(c);
    last = c;
  }
  pts.push(
    { x: 0, y: -o.h * 0.75 },
    { x: 0, y: -o.h * 0.32 },
    { x: 0, y: -o.h * 0.07 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  );

  const P = (i: number) => pts[clamp(i, 0, pts.length - 1)];
  const seg = pts.length - 1;
  const N = seg * 32 + 1;
  const pos = Array.from({ length: N }, (_, k) => {
    const off = k / (N - 1);
    const u = (0.8 * off + 0.2 * off * off * (3 - 2 * off)) * seg;
    const i = Math.min(Math.floor(u), seg - 1);
    const t = u - i;
    return {
      off,
      x: cr(P(i - 1).x, P(i).x, P(i + 1).x, P(i + 2).x, t),
      y: cr(P(i - 1).y, P(i).y, P(i + 1).y, P(i + 2).y, t),
    };
  });
  let facing = 1;
  return pos.map((p, k) => {
    const dx = (pos[Math.min(k + 1, N - 1)].x - pos[Math.max(k - 1, 0)].x) / 2;
    if (Math.abs(dx) > 1) facing = dx < 0 ? -1 : 1;
    const tilt = clamp(dx * 0.35, -12, 12);
    const sc = 1 + 0.1 * Math.sin(Math.PI * p.off);
    return {
      offset: p.off,
      transform: `translate(${p.x}px,${p.y}px) rotate(${tilt}deg) scaleX(${facing}) scale(${sc})`,
    };
  });
}

export default function Mascot({
  small = false,
  speech,
  savedCount,
  locale = "id",
}: Props) {
  const copy = getTranslations(locale);
  const hasTiko = savedCount === undefined || savedCount >= 3;
  const [phase, setPhase] = useState<Phase>("nest");
  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);
  useEffect(() => {
    Object.values(IMG).forEach((src) => {
      const i = new Image();
      i.src = src;
    });
  }, []);

  const land = useCallback(() => {
    setFlyer(null);
    setPhase("landed");
    timers.current.push(window.setTimeout(() => setPhase("nest"), LANDED_MS));
  }, []);

  const fly = useCallback(() => {
    if (phase === "flying") return;
    clearTimers();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      land();
      return;
    }
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = r.width * 0.82;
    const h = w * FLY_ASPECT;
    const bx = r.left + window.scrollX;
    const by = r.top + window.scrollY;
    setFlyer({
      x: bx + (r.width - w) / 2,
      y: by - h * 0.04,
      w,
      h,
    });
    setPhase("flying");
  }, [phase, land]);

  useEffect(() => {
    if (!flyer || !flyerRef.current) return;
    const anim = flyerRef.current.animate(buildKeyframes(flyer), {
      duration: FLY_MS,
      easing: "linear",
      fill: "forwards",
    });
    anim.onfinish = land;
    return () => {
      anim.onfinish = null;
      anim.cancel();
    };
  }, [flyer]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fly();
    }
  };

  return (
    <>
      <div
        className={`mascot-wrap tiko ${
          small ? "mascot-small" : ""
        } is-${phase}${hasTiko ? "" : " is-egg"}`}
        role={hasTiko ? "button" : "img"}
        tabIndex={hasTiko ? 0 : undefined}
        aria-label={hasTiko ? copy.mascotLabel : copy.eggLabel(savedCount ?? 0)}
        onClick={hasTiko ? fly : undefined}
        onKeyDown={hasTiko ? onKey : undefined}
      >
        <div className="mascot-shadow" />
        <div ref={boxRef} className="tk-box">
          {hasTiko ? (
            <>
              <img
                className="tk-nest"
                src={phase === "flying" ? IMG.nestEmpty : IMG.nest}
                alt=""
                draggable={false}
              />
              <svg
                className="tk-blink"
                viewBox="0 0 430 358"
                aria-hidden="true"
              >
                <ellipse cx="196.6" cy="177" rx="14" ry="18" fill="#f8efdd" />
                <ellipse cx="288" cy="164.6" rx="14" ry="18" fill="#f8efdd" />
                <path
                  d="M184 181 Q196.6 190 209 181 M276 169 Q288 178 300 169"
                  fill="none"
                  stroke="#3b2b24"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>
              <svg
                className="tk-heart"
                viewBox="-16 -12 32 28"
                aria-hidden="true"
              >
                <path
                  d="M0 -2 C-6 -10 -15 -2 0 9 C15 -2 6 -10 0 -2Z"
                  fill="#e8806f"
                />
              </svg>
            </>
          ) : (
            <>
              <img
                className="tk-nest"
                src={IMG.nestEmpty}
                alt=""
                draggable={false}
              />
              <svg className="tk-egg" viewBox="0 0 100 125" aria-hidden="true">
                <defs>
                  <linearGradient id="egg-shell" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#f4e8ce" />
                    <stop offset="1" stopColor="#d6bd98" />
                  </linearGradient>
                  <clipPath id="egg-shape">
                    <path d="M50 4 C68 4 80 19 87 42 C95 68 95 91 85 108 C77 120 65 123 50 123 C35 123 23 120 15 108 C5 91 5 68 13 42 C20 19 32 4 50 4Z" />
                  </clipPath>
                </defs>
                <path
                  d="M50 4 C68 4 80 19 87 42 C95 68 95 91 85 108 C77 120 65 123 50 123 C35 123 23 120 15 108 C5 91 5 68 13 42 C20 19 32 4 50 4Z"
                  fill="url(#egg-shell)"
                  stroke="#aa8d67"
                  strokeWidth="2"
                />
                <g clipPath="url(#egg-shape)" fill="#604735">
                  <ellipse
                    cx="32"
                    cy="29"
                    rx="1.4"
                    ry="2.4"
                    transform="rotate(28 32 29)"
                  />
                  <ellipse
                    cx="57"
                    cy="24"
                    rx="1.2"
                    ry="2"
                    transform="rotate(-24 57 24)"
                  />
                  <ellipse
                    cx="73"
                    cy="38"
                    rx="2"
                    ry="3.2"
                    transform="rotate(34 73 38)"
                  />
                  <ellipse
                    cx="45"
                    cy="43"
                    rx="1.6"
                    ry="2.5"
                    transform="rotate(-35 45 43)"
                  />
                  <ellipse
                    cx="23"
                    cy="51"
                    rx="2.2"
                    ry="3.8"
                    transform="rotate(18 23 51)"
                  />
                  <ellipse cx="61" cy="49" rx="1.1" ry="1.8" />
                  <ellipse
                    cx="81"
                    cy="59"
                    rx="1.6"
                    ry="2.8"
                    transform="rotate(-22 81 59)"
                  />
                  <ellipse
                    cx="37"
                    cy="62"
                    rx="2"
                    ry="3.1"
                    transform="rotate(24 37 62)"
                  />
                  <ellipse
                    cx="54"
                    cy="68"
                    rx="3.5"
                    ry="4.8"
                    transform="rotate(-18 54 68)"
                  />
                  <ellipse
                    cx="70"
                    cy="75"
                    rx="1.4"
                    ry="2.4"
                    transform="rotate(30 70 75)"
                  />
                  <ellipse
                    cx="18"
                    cy="78"
                    rx="1.5"
                    ry="2.7"
                    transform="rotate(-16 18 78)"
                  />
                  <ellipse cx="43" cy="84" rx="1.2" ry="2" />
                  <ellipse
                    cx="83"
                    cy="88"
                    rx="2.8"
                    ry="4"
                    transform="rotate(30 83 88)"
                  />
                  <ellipse
                    cx="31"
                    cy="94"
                    rx="4.2"
                    ry="5.8"
                    transform="rotate(-25 31 94)"
                  />
                  <ellipse
                    cx="61"
                    cy="91"
                    rx="1.8"
                    ry="3"
                    transform="rotate(20 61 91)"
                  />
                  <ellipse
                    cx="48"
                    cy="108"
                    rx="3.2"
                    ry="4.3"
                    transform="rotate(12 48 108)"
                  />
                  <ellipse
                    cx="73"
                    cy="108"
                    rx="1.3"
                    ry="2.4"
                    transform="rotate(-30 73 108)"
                  />
                  <ellipse cx="16" cy="105" rx="1.4" ry="2.4" />
                </g>
                <g clipPath="url(#egg-shape)" fill="#8b6a4c">
                  <circle cx="41" cy="19" r="1" />
                  <circle cx="68" cy="28" r="1" />
                  <circle cx="51" cy="35" r="1.3" />
                  <circle cx="30" cy="40" r="1" />
                  <circle cx="79" cy="48" r="1" />
                  <circle cx="49" cy="54" r="1" />
                  <circle cx="28" cy="69" r="1.1" />
                  <circle cx="64" cy="61" r="1.2" />
                  <circle cx="76" cy="68" r="1.1" />
                  <circle cx="39" cy="75" r="1" />
                  <circle cx="56" cy="81" r="1" />
                  <circle cx="21" cy="88" r="1.2" />
                  <circle cx="72" cy="96" r="1" />
                  <circle cx="39" cy="104" r="1.2" />
                </g>
                <ellipse
                  cx="34"
                  cy="34"
                  rx="5"
                  ry="9"
                  fill="#fff8e8"
                  opacity=".55"
                />
              </svg>
              <img
                className="tk-nest tk-nest-front"
                src={IMG.nestFront}
                alt=""
                draggable={false}
              />
            </>
          )}
        </div>
      </div>
      {speech && phase !== "flying" && (
        <p className="mascot-speech">{speech}</p>
      )}

      {flyer &&
        createPortal(
          <div
            ref={flyerRef}
            className="tk-flyer"
            aria-hidden="true"
            style={{
              left: flyer.x,
              top: flyer.y,
              width: flyer.w,
              height: flyer.h,
            }}
          >
            <div className="tk-flyer-shadow" />
            <div className="tk-flyer-inner">
              <img
                className="tk-frame tk-frame-a"
                src={IMG.fly1}
                alt=""
                draggable={false}
              />
              <img
                className="tk-frame tk-frame-b"
                src={IMG.fly2}
                alt=""
                draggable={false}
              />
              <svg
                className="tk-arc"
                viewBox="0 0 200 180"
                fill="none"
                stroke="#7a8f5a"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M14 96 Q2 112 8 132" />
                <path d="M26 108 Q18 120 22 136" />
                <path d="M186 96 Q198 112 192 132" />
                <path d="M174 108 Q182 120 178 136" />
              </svg>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
