import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fallback = window.setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 4500);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      gsap.set(logoRef.current, { opacity: 0, y: 30 });
      gsap.set(barRef.current, { scaleX: 0, transformOrigin: "left center" });

      tl.to(logoRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
      })
        .to(
          barRef.current,
          {
            scaleX: 1,
            duration: 1.4,
            ease: "power2.inOut",
            onUpdate: function () {
              const progress = Math.round(this.progress() * 100);
              if (percentRef.current) {
                percentRef.current.textContent = `${progress}%`;
              }
            },
          },
          "-=0.2"
        )
        .to(
          logoRef.current,
          { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" },
          "+=0.2"
        )
        .to(
          progressRef.current,
          { opacity: 0, duration: 0.3, ease: "power2.in" },
          "<"
        )
        .to(overlayRef.current, {
          yPercent: -100,
          duration: 0.8,
          ease: "power4.inOut",
          onComplete: () => {
            window.clearTimeout(fallback);
            setVisible(false);
            onComplete();
          },
        });
    }, loaderRef);

    return () => {
      window.clearTimeout(fallback);
      ctx.revert();
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      ref={loaderRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "all",
      }}
    >
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#0A0A0A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2.5rem",
        }}
      >
        <div ref={logoRef} style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(3rem, 10vw, 7rem)",
              letterSpacing: "0.15em",
              lineHeight: 1,
              color: "#F5F5F5",
            }}
          >
            <span style={{ color: "#39FF14" }}>1</span> JAMAICA
            <span
              style={{
                display: "block",
                color: "#E8FF00",
                fontSize: "0.45em",
                letterSpacing: "0.5em",
                marginTop: "0.2em",
              }}
            >
              MUSIC
            </span>
          </div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "#888888",
              fontSize: "0.85rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginTop: "1rem",
            }}
          >
            Representing the sound of Jamaica
          </p>
        </div>

        <div ref={progressRef} style={{ width: "min(320px, 70vw)" }}>
          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "#222222",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              ref={barRef}
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "#E8FF00",
                boxShadow: "0 0 12px rgba(232,255,0,0.6)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "0.6rem",
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.7rem",
                color: "#444444",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Loading
            </span>
            <span
              ref={percentRef}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "0.85rem",
                color: "#E8FF00",
                letterSpacing: "0.1em",
              }}
            >
              0%
            </span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "0.4rem",
          }}
        >
          {["1 JAMAICA MUSIC", "·", "1 JAMAICA MUSIC", "·", "EST. 2022"].map(
            (word, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "0.65rem",
                  color: i % 2 === 1 ? "#E8FF00" : "#333333",
                  letterSpacing: "0.2em",
                }}
              >
                {word}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
