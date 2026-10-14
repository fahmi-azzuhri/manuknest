import { useEffect, useRef } from "react";

type FilterDrag = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
};

type CategoryFiltersProps = {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
};

export default function CategoryFilters({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFiltersProps) {
  const drag = useRef<FilterDrag | null>(null);
  const inertiaFrame = useRef<number | null>(null);
  const suppressClick = useRef(false);

  useEffect(
    () => () => {
      if (inertiaFrame.current !== null) {
        cancelAnimationFrame(inertiaFrame.current);
      }
    },
    [],
  );

  return (
    <div
      className="filter-chips"
      aria-label="Filter kategori"
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        if (inertiaFrame.current !== null) {
          cancelAnimationFrame(inertiaFrame.current);
          inertiaFrame.current = null;
        }
        drag.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startScrollLeft: event.currentTarget.scrollLeft,
          lastX: event.clientX,
          lastTime: event.timeStamp,
          velocity: 0,
          moved: false,
        };
      }}
      onPointerMove={(event) => {
        const currentDrag = drag.current;
        if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
        const distance = event.clientX - currentDrag.startX;
        if (!currentDrag.moved && Math.abs(distance) > 6) {
          currentDrag.moved = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        if (!currentDrag.moved) return;

        const elapsed = Math.max(event.timeStamp - currentDrag.lastTime, 1);
        currentDrag.velocity =
          -(event.clientX - currentDrag.lastX) / elapsed;
        currentDrag.lastX = event.clientX;
        currentDrag.lastTime = event.timeStamp;
        event.currentTarget.scrollLeft =
          currentDrag.startScrollLeft - distance;
      }}
      onPointerUp={(event) => {
        const currentDrag = drag.current;
        if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
        drag.current = null;
        if (!currentDrag.moved) return;

        suppressClick.current = true;
        let velocity = Math.max(-1.5, Math.min(1.5, currentDrag.velocity));
        let previousTime = event.timeStamp;
        const scrollElement = event.currentTarget;
        const coast = (time: number) => {
          const elapsed = Math.min(time - previousTime, 32);
          previousTime = time;
          scrollElement.scrollLeft += velocity * elapsed;
          velocity *= Math.pow(0.94, elapsed / 16);
          if (Math.abs(velocity) > 0.02) {
            inertiaFrame.current = requestAnimationFrame(coast);
          } else {
            inertiaFrame.current = null;
          }
        };
        inertiaFrame.current = requestAnimationFrame(coast);
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
      }}
    >
      {categories.map((category) => (
        <button
          key={category}
          className={activeCategory === category ? "chip active" : "chip"}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
