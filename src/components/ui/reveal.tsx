"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type ElementType } from "react";

import { cn } from "@/lib/utils";

type RevealFrom = "up" | "down" | "left" | "right" | "fade";

// One shared observer for every Reveal on the page. Framer Motion's
// `whileInView` creates an observer per element and then drives the transform
// from a JS rAF loop; here the observer only flips an attribute and the
// animation itself runs on the compositor, so scrolling stays off the main
// thread.
let sharedObserver: IntersectionObserver | null = null;
const pending = new WeakMap<Element, () => void>();

function getObserver() {
  if (sharedObserver) {
    return sharedObserver;
  }

  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const run = pending.get(entry.target);
        pending.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
        run?.();
      }
    },
    // Fire slightly before the element is fully on screen so the reveal reads
    // as part of the scroll rather than as a late pop-in.
    { rootMargin: "0px 0px -8% 0px" },
  );

  return sharedObserver;
}

type RevealProps<T extends ElementType> = {
  as?: T;
  from?: RevealFrom;
  /** Stagger offset in milliseconds. */
  delay?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/**
 * Reveals its children once, when scrolled into view, using a CSS keyframe
 * animation on `opacity`/`transform` only.
 *
 * The element is promoted for the duration of the animation and released again
 * on `animationend`, so a long page does not accumulate composited layers.
 */
export function Reveal<T extends ElementType = "div">({
  as,
  from = "up",
  delay = 0,
  className,
  style,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.reveal = "done";
      return;
    }

    const onAnimationEnd = () => {
      el.dataset.reveal = "done";
    };

    const reveal = () => {
      el.addEventListener("animationend", onAnimationEnd, { once: true });
      el.dataset.reveal = "in";
    };

    const observer = getObserver();
    pending.set(el, reveal);
    observer.observe(el);

    return () => {
      pending.delete(el);
      observer.unobserve(el);
      el.removeEventListener("animationend", onAnimationEnd);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal="hidden"
      data-reveal-from={from}
      className={cn(className)}
      style={delay ? { ...style, animationDelay: `${delay}ms` } : style}
      {...rest}
    />
  );
}
