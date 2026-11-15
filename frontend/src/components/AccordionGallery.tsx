import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import "./AccordionGallery.css";

export type AccordionGalleryItem = {
  image: string;
  label: string;
  description: string;
  alt: string;
};

type AccordionGalleryProps = {
  items: AccordionGalleryItem[];
  defaultIndex?: number;
  accentColor?: string;
  overlayColor?: string;
  textColor?: string;
  height?: number;
  gap?: number;
  radius?: number;
  expandRatio?: number;
  duration?: number;
  ease?: string;
  parallax?: number;
  tilt?: number;
  stagger?: number;
};

export default function AccordionGallery({
  items,
  defaultIndex = -1,
  accentColor = "#39d5e5",
  overlayColor = "#080909",
  textColor = "#f4f0e8",
  height = 420,
  gap = 10,
  radius = 12,
  expandRatio = 0.42,
  duration = 0.65,
  ease = "power3.out",
  parallax = 0.5,
  tilt = 5,
  stagger = 0.06,
}: AccordionGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(() =>
    defaultIndex >= 0 && defaultIndex < items.length ? defaultIndex : -1,
  );
  const [vertical, setVertical] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const mediaSizeRef = useRef(320);

  const applyLayout = useCallback(
    (animate: boolean) => {
      const panels = panelRefs.current;
      if (!panels.length) return;

      const ratio = Math.min(Math.max(expandRatio, 0.2), 0.9);
      const expandedGrow = items.length > 1 ? (ratio * (items.length - 1)) / (1 - ratio) : 1;
      const durationSeconds =
        animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? duration : 0;

      timelineRef.current?.kill();
      const timeline = gsap.timeline();

      panels.forEach((panel, index) => {
        if (!panel) return;

        const isActive = index === activeIndex;
        const hasActivePanel = activeIndex >= 0;
        const media = mediaRefs.current[index];
        const bar = barRefs.current[index];
        const text = textRefs.current[index];
        const rotation = !hasActivePanel || isActive ? 0 : index < activeIndex ? tilt : -tilt;
        const drift = hasActivePanel ? Math.max(-1.5, Math.min(1.5, activeIndex - index)) : 0;
        const shift = drift * parallax * mediaSizeRef.current * 0.06;

        timeline.to(
          panel,
          {
            flexGrow: isActive ? expandedGrow : 1,
            rotateY: vertical ? 0 : rotation,
            rotateX: vertical ? -rotation : 0,
            "--ag-dim": isActive ? 0 : 0.34,
            duration: durationSeconds,
            ease,
          },
          0,
        );

        if (media) {
          timeline.to(
            media,
            {
              xPercent: -50,
              yPercent: -50,
              x: vertical ? 0 : isActive ? 0 : shift,
              y: vertical && !isActive ? shift : 0,
              "--ag-gray": isActive ? 0 : 0.35,
              duration: durationSeconds,
              ease,
            },
            0,
          );
        }

        if (bar && text) {
          if (isActive) {
            timeline.to(
              [bar, text],
              {
                opacity: 1,
                x: 0,
                duration: durationSeconds,
                ease,
                stagger: durationSeconds ? stagger : 0,
              },
              0,
            );
          } else {
            timeline.to(
              [bar, text],
              { opacity: 0, x: -14, duration: durationSeconds * 0.6, ease },
              0,
            );
          }
        }
      });

      timelineRef.current = timeline;
    },
    [activeIndex, duration, ease, expandRatio, items.length, parallax, stagger, tilt, vertical],
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const updateOrientation = () => setVertical(query.matches);
    updateOrientation();
    query.addEventListener("change", updateOrientation);
    return () => query.removeEventListener("change", updateOrientation);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const bounds = root.getBoundingClientRect();
      const total = vertical ? bounds.height : bounds.width;
      const usable = Math.max(total - gap * (items.length - 1), 120);
      mediaSizeRef.current = Math.max(
        140,
        usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22,
      );
      root.style.setProperty("--ag-media-size", `${mediaSizeRef.current}px`);
      applyLayout(false);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [applyLayout, expandRatio, gap, items.length, vertical]);

  useEffect(() => {
    applyLayout(true);
  }, [applyLayout]);

  useEffect(
    () => () => {
      timelineRef.current?.kill();
    },
    [],
  );

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % items.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + items.length) % items.length;
    }

    if (nextIndex !== undefined) {
      event.preventDefault();
      panelRefs.current[nextIndex]?.focus();
    }
  };

  const galleryStyle: CSSProperties & Record<`--${string}`, string | number> = {
    "--ag-accent": accentColor,
    "--ag-overlay": overlayColor,
    "--ag-text": textColor,
    "--ag-gap": `${gap}px`,
    "--ag-radius": `${radius}px`,
    height: `${height}px`,
  };

  return (
    <div
      ref={rootRef}
      className={`mavros-platform-gallery${vertical ? " mavros-platform-gallery--vertical" : ""}`}
      style={galleryStyle}
      role="group"
      aria-label="Platform capabilities"
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={item.label}
            ref={(element) => {
              panelRefs.current[index] = element;
            }}
            className={`mavros-platform-gallery__panel${isActive ? " is-active" : ""}`}
            style={{ borderRadius: `${radius}px` }}
            type="button"
            aria-label={`${item.label}. ${item.description}`}
            aria-pressed={isActive}
            onPointerEnter={(event) => {
              if (event.pointerType !== "touch") setActiveIndex(index);
            }}
            onFocus={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(event) => handleKeyDown(index, event)}
          >
            <span className="mavros-platform-gallery__frame">
              <span
                className="mavros-platform-gallery__media"
                ref={(element) => {
                  mediaRefs.current[index] = element;
                }}
              >
                <img src={item.image} alt={item.alt} draggable={false} />
              </span>
              <span className="mavros-platform-gallery__overlay" aria-hidden="true" />
            </span>
            <span className="mavros-platform-gallery__caption" aria-hidden="true">
              <span
                className="mavros-platform-gallery__bar"
                ref={(element) => {
                  barRefs.current[index] = element;
                }}
              />
              <span
                className="mavros-platform-gallery__copy"
                ref={(element) => {
                  textRefs.current[index] = element;
                }}
              >
                <span className="mavros-platform-gallery__title">{item.label}</span>
                <span className="mavros-platform-gallery__description">{item.description}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
