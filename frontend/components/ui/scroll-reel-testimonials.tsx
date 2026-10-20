"use client";
import Image from "next/image";

import * as React from "react";

/* ----------------------------------------------------------------
 * ScrollReelTestimonials — Stonky investor quote reel.
 *
 * Reworked so the PORTRAIT dominates (~2/3 of the card on desktop, a tall
 * hero panel on mobile). Faces are large, grayscale, and premium. The quote
 * rises in character-by-character; the old quote exits as a whole first. A
 * thumbnail rail lets you jump straight to any figure. Each quote carries a
 * one-line Stonky connection underneath.
 * ---------------------------------------------------------------- */

export interface ScrollReelTestimonial {
  quote: string;
  author: string;
  image: string;
  alt?: string;
  /** One-line Stonky connection, shown under the author in accent green. */
  note?: string;
  /** Per-person object-position so every face sits centred and uniform. */
  pos?: string;
}

export interface ScrollReelTestimonialsProps {
  testimonials: ScrollReelTestimonial[];
  charStaggerMs?: number;
  className?: string;
}

const EXIT_MS = 240;
const LOCK_MS = 720;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* Per-character split with stagger; spaces live between word spans. */
function Chars({ text, startIndex, staggerMs }: { text: string; startIndex: number; staggerMs: number }) {
  let idx = startIndex;
  const words = text.split(" ");
  return (
    <>
      {words.map((word, wi) => {
        const wordSpan = (
          <span className="inline-block whitespace-nowrap">
            {Array.from(word).map((ch, ci) => {
              const delay = idx * staggerMs;
              idx++;
              return (
                <span key={ci} className="scroll-reel-char" style={{ animationDelay: `${delay}ms` }}>
                  {ch}
                </span>
              );
            })}
          </span>
        );
        if (wi < words.length - 1) idx++;
        return (
          <React.Fragment key={wi}>
            {wordSpan}
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

export function ScrollReelTestimonials({ testimonials, charStaggerMs = 5, className }: ScrollReelTestimonialsProps) {
  const [index, setIndex] = React.useState(0);
  const [displayIndex, setDisplayIndex] = React.useState(0);
  const [exiting, setExiting] = React.useState(false);
  const animating = React.useRef(false);
  const timeouts = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const count = testimonials.length;

  React.useEffect(() => {
    const t = timeouts.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const goTo = React.useCallback(
    (next: number) => {
      if (animating.current || next === index || next < 0 || next >= count) return;
      animating.current = true;
      setIndex(next);
      setExiting(true);
      timeouts.current.push(
        setTimeout(() => {
          setDisplayIndex(next);
          setExiting(false);
        }, EXIT_MS)
      );
      timeouts.current.push(
        setTimeout(() => {
          animating.current = false;
        }, LOCK_MS)
      );
    },
    [index, count]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
  };

  const current = testimonials[displayIndex];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Investing wisdom"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "relative grid w-full max-w-[1080px] grid-cols-1 overflow-hidden rounded-3xl outline-none lg:grid-cols-[1.5fr_1fr]",
        className
      )}
      style={{
        background: "linear-gradient(180deg, var(--surface-2), var(--surface))",
        border: "1px solid var(--border-2)",
        boxShadow: "0 40px 90px rgba(0,0,0,0.5)",
        minHeight: 460,
      }}
    >
      {/* QUOTE panel leads (~60%) */}
      <div className="relative order-2 lg:order-1 flex flex-col justify-between gap-7 p-7 sm:p-10" style={{ borderTop: "1px solid var(--border-2)" }}>
        <div>
          <svg className="block h-11 w-11 mb-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ color: "rgba(220,190,110,0.5)" }}>
            <path d="M4.58 17.32C3.55 16.23 3 15 3 13.01c0-3.5 2.46-6.64 6.03-8.19l.9 1.38c-3.34 1.8-4 4.15-4.25 5.62.54-.28 1.24-.38 1.93-.31 1.8.17 3.23 1.65 3.23 3.49a3.5 3.5 0 0 1-3.5 3.5c-1.07 0-2.1-.49-2.75-1.18zm10 0C13.55 16.23 13 15 13 13.01c0-3.5 2.46-6.64 6.03-8.19l.9 1.38c-3.34 1.8-4 4.15-4.25 5.62.54-.28 1.24-.38 1.93-.31 1.8.17 3.23 1.65 3.23 3.49a3.5 3.5 0 0 1-3.5 3.5c-1.07 0-2.1-.49-2.75-1.18z" />
          </svg>
          <div className="relative overflow-hidden" aria-live="polite">
            {/* invisible copy sizes the stage so wrapped text never clips */}
            <div aria-hidden className="invisible flex min-h-[190px] flex-col gap-4">
              <p className="m-0 font-medium leading-[1.28] tracking-[-0.02em]" style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.95rem)" }}>{current.quote}</p>
              {current.note ? <p className="m-0 text-sm leading-[1.4]">{current.note}</p> : null}
            </div>
            <div key={displayIndex} className={cn("absolute inset-x-0 top-0 flex flex-col gap-4 will-change-[transform,opacity]", exiting && "scroll-reel-exit")}>
              <p className="m-0 font-medium leading-[1.28] tracking-[-0.02em]" style={{ color: "var(--text)", fontSize: "clamp(1.4rem, 2.4vw, 1.95rem)" }}>
                <Chars text={current.quote} startIndex={0} staggerMs={charStaggerMs} />
              </p>
              {current.note ? (
                <p className="m-0 text-sm leading-[1.45]" style={{ color: "#5FBF8A" }}>
                  <Chars text={current.note} startIndex={current.quote.length + 6} staggerMs={charStaggerMs} />
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* nav: thumbnail rail + arrows + counter */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {testimonials.map((tm, i) => (
              <button
                key={tm.image}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${tm.author}`}
                className="relative h-9 w-9 overflow-hidden rounded-full transition-transform duration-200 hover:scale-110"
                style={{ border: i === index ? "1.5px solid #5FBF8A" : "1px solid var(--border-2)", boxShadow: i === index ? "0 0 0 2px rgba(46,148,102,0.2)" : "none" }}
              >
                <Image src={tm.image} alt="" fill sizes="36px" className="object-cover" style={{ objectPosition: tm.pos ?? "center 28%", filter: i === index ? "none" : "saturate(0.5) brightness(0.85)" }} />
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs tabular-nums" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
              <span style={{ color: "#5FBF8A" }}>{String(index + 1).padStart(2, "0")}</span> / {String(count).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous quote"
                className="grid h-9 w-9 place-items-center rounded-full transition-transform duration-200 hover:enabled:scale-[1.08] active:enabled:scale-95 disabled:opacity-30"
                style={{ border: "1px solid var(--border-3)", color: "var(--text)", background: "var(--surface-2)" }}>
                <svg className="h-3.5 w-3.5 opacity-80" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 2.5 3.5 6l4 3.5" /></svg>
              </button>
              <button type="button" onClick={() => goTo(index + 1)} disabled={index === count - 1} aria-label="Next quote"
                className="grid h-9 w-9 place-items-center rounded-full transition-transform duration-200 hover:enabled:scale-[1.08] active:enabled:scale-95 disabled:opacity-30"
                style={{ border: "1px solid var(--border-3)", color: "var(--text)", background: "var(--surface-2)" }}>
                <svg className="h-3.5 w-3.5 opacity-80" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 2.5 4 3.5-4 3.5" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PORTRAIT (~40%) — the face fills it, centred and crisp. Stacked; the
          active one cross-fades. No grayscale/blur; per-person object-position
          keeps every face uniform. */}
      {/* Several of these portraits only exist at 180-300px (Lynch is 177px
          wide, Franklin 202px). Stretched across a full 430px column they were
          visibly soft, which is what read as "badly rendered". They are now
          framed at 208px -- inside what every source can actually resolve,
          even at 2x -- and the quote carries the composition instead. */}
      <div className="relative order-1 lg:order-2 grid place-items-center p-8" style={{ minHeight: 320 }}>
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            width: 208,
            height: 252,
            boxShadow: "0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
            border: "1px solid var(--border-2)",
          }}
        >
          {testimonials.map((tm, i) => (
            <Image
              key={tm.image}
              src={tm.image}
              alt={tm.alt ?? tm.author}
              fill
              sizes="208px"
              priority={i === 0}
              className="object-cover"
              style={{
                objectPosition: tm.pos ?? "center 26%",
                filter: "contrast(1.05) saturate(0.96)",
                opacity: i === displayIndex ? 1 : 0,
                transform: i === displayIndex ? "scale(1)" : "scale(1.04)",
                transition: "opacity 700ms cubic-bezier(0.22,1,0.36,1), transform 1200ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          ))}
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(7,7,9,0) 62%, rgba(7,7,9,0.55) 100%)" }} />
        </div>
        <div aria-hidden className="absolute inset-y-0 left-0 w-16 pointer-events-none hidden lg:block" style={{ background: "linear-gradient(90deg, var(--surface), transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-base font-semibold" style={{ color: "var(--text)", letterSpacing: "-0.01em" }}>{current.author}</p>
          <p className="text-[0.62rem]" style={{ color: "var(--accent-2)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>INVESTING GREAT</p>
        </div>
      </div>
    </div>
  );
}

export default ScrollReelTestimonials;
