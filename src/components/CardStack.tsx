import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";

export type StackItem = {
  id: number | string;
  tone: string;
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  subtitle: string;
  byline?: ReactNode;
  aside?: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
};

const EASE_OUT = "cubic-bezier(.2,.9,.25,1)";
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Collapse({
  open,
  id,
  children,
}: {
  open: boolean;
  id: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      if (!open) setMounted(false);
      return;
    }
    const height = el.scrollHeight;
    const anim = open
      ? el.animate(
          [
            { height: "0px", opacity: 0 },
            { height: `${height}px`, opacity: 1 },
          ],
          { duration: 420, easing: EASE_OUT },
        )
      : el.animate(
          [
            { height: `${height}px`, opacity: 1 },
            { height: "0px", opacity: 0 },
          ],
          { duration: 260, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" },
        );
    if (!open) anim.onfinish = () => setMounted(false);
    return () => {
      anim.onfinish = null;
      anim.cancel();
    };
  }, [open]);

  if (!mounted) return null;
  return (
    <div id={id} ref={ref} className="stack-collapse">
      {children}
    </div>
  );
}

function StackCard({
  item,
  index,
  collapsible,
  open,
  onToggle,
}: {
  item: StackItem;
  index: number;
  collapsible: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const bodyId = useId();
  const iconClassName = ["stack-icon", item.iconClassName]
    .filter(Boolean)
    .join(" ");
  const itemRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const prevOpen = useRef(open);
  const clicked = useRef(false);
  const startedOpen = useRef(open && collapsible);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || prefersReducedMotion()) return;
    const anim = card.animate(
      [
        { opacity: 0, transform: "translateY(-38px) scale(.95)" },
        {
          opacity: 1,
          transform: startedOpen.current ? "rotate(-1.6deg)" : "none",
        },
      ],
      {
        duration: 560,
        delay: Math.min(index, 8) * 70,
        easing: EASE_OUT,
        fill: "backwards",
      },
    );
    return () => anim.cancel();
  }, []);

  useEffect(() => {
    if (!collapsible || prevOpen.current === open) return;
    prevOpen.current = open;
    const card = cardRef.current;
    if (!card || prefersReducedMotion()) return;
    const frames: Keyframe[] = open
      ? [
          { transform: "rotate(0deg) scale(1)" },
          { transform: "rotate(-2.8deg) scale(1.012)", offset: 0.55 },
          { transform: "rotate(-1.6deg) scale(1)" },
        ]
      : [
          { transform: "rotate(-1.6deg)" },
          { transform: "rotate(.7deg)", offset: 0.5 },
          { transform: "rotate(0deg)" },
        ];
    const anim = card.animate(frames, { duration: 480, easing: EASE_OUT });
    let timer: number | undefined;
    if (open && clicked.current) {
      timer = window.setTimeout(
        () =>
          itemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
        260,
      );
    }
    clicked.current = false;
    return () => {
      anim.cancel();
      window.clearTimeout(timer);
    };
  }, [open, collapsible]);

  const content = (
    <div className="stack-body">
      {item.body}
      {item.footer && <div className="stack-footer">{item.footer}</div>}
    </div>
  );

  return (
    <div
      ref={itemRef}
      className={open && collapsible ? "stack-item is-open" : "stack-item"}
    >
      <article
        ref={cardRef}
        className="stack-card"
        style={{ "--tone": item.tone } as CSSProperties}
      >
        <div className="stack-head">
          {collapsible ? (
            <button
              type="button"
              className="stack-main stack-toggle"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => {
                clicked.current = true;
                onToggle();
              }}
            >
              <span className={iconClassName} aria-hidden="true">
                {item.icon}
              </span>
              <span className="stack-text">
                <span className="stack-title">{item.title}</span>
                {item.subtitle && (
                  <span className="stack-sub">{item.subtitle}</span>
                )}
              </span>
              <span className="stack-chevron" aria-hidden="true">
                <ChevronDown size={18} />
              </span>
            </button>
          ) : (
            <div className="stack-main">
              <span className={iconClassName} aria-hidden="true">
                {item.icon}
              </span>
              <span className="stack-text">
                <span className="stack-title">{item.title}</span>
                {item.subtitle && (
                  <span className="stack-sub">{item.subtitle}</span>
                )}
              </span>
            </div>
          )}
          {item.aside && <div className="stack-aside">{item.aside}</div>}
        </div>
        {item.byline && <div className="stack-byline">{item.byline}</div>}
        {collapsible ? (
          <Collapse open={open} id={bodyId}>
            {content}
          </Collapse>
        ) : (
          content
        )}
      </article>
    </div>
  );
}

export default function CardStack({
  items,
  collapsible = true,
  scrollEffect = !collapsible,
}: {
  items: StackItem[];
  collapsible?: boolean;
  scrollEffect?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemsKey = items.map((item) => item.id).join(",");
  const [choice, setChoice] = useState<{
    key: string;
    id: number | string | null;
  } | null>(null);
  const lastId = items.length > 0 ? items[items.length - 1].id : null;
  const activeId = choice && choice.key === itemsKey ? choice.id : lastId;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !scrollEffect || prefersReducedMotion()) return;
    let frame = 0;
    const nodes = () =>
      Array.from(root.querySelectorAll<HTMLElement>(":scope > .stack-item"));

    const apply = () => {
      frame = 0;
      const vh = window.innerHeight;
      const rootTop = root.getBoundingClientRect().top;
      for (const el of nodes()) {
        const center = rootTop + el.offsetTop + el.offsetHeight / 2;
        const d = (center - vh * 0.5) / vh;
        if (collapsible) {
          const k = Math.min(1, Math.abs(d) * 1.7);
          el.style.transform = `translate3d(0,${(-d * 22).toFixed(1)}px,0) scale(${(1 - k * 0.07).toFixed(3)})`;
        } else {
          const above = d < 0;
          const k = Math.min(1, Math.abs(d) * 2.2);
          const scale = 1 - k * (above ? 0.1 : 0.06);
          const tilt = above ? k * 9 : -k * 4;
          const shift = above ? -d * 46 : -d * 18;
          el.style.transformOrigin = above ? "50% 100%" : "50% 0%";
          el.style.transform = `translate3d(0,${shift.toFixed(1)}px,0) rotateX(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        }
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      for (const el of nodes()) {
        el.style.transform = "";
        el.style.transformOrigin = "";
      }
    };
  }, [itemsKey, collapsible, scrollEffect]);

  return (
    <div
      className={collapsible ? "stack stack-collapsible" : "stack stack-open"}
      ref={rootRef}
    >
      {items.map((item, index) => (
        <StackCard
          key={item.id}
          item={item}
          index={index}
          collapsible={collapsible}
          open={collapsible ? activeId === item.id : true}
          onToggle={() =>
            setChoice({
              key: itemsKey,
              id: activeId === item.id ? null : item.id,
            })
          }
        />
      ))}
    </div>
  );
}
