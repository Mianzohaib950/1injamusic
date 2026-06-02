import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ mouseX: 0, mouseY: 0, destinationX: 0, destinationY: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      positionRef.current.mouseX = e.clientX;
      positionRef.current.mouseY = e.clientY;
    };

    window.addEventListener("mousemove", onMouseMove);

    const followMouse = () => {
      positionRef.current.destinationX += (positionRef.current.mouseX - positionRef.current.destinationX) * 0.15;
      positionRef.current.destinationY += (positionRef.current.mouseY - positionRef.current.destinationY) * 0.15;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${positionRef.current.destinationX}px, ${positionRef.current.destinationY}px, 0)`;
      }

      requestAnimationFrame(followMouse);
    };

    requestAnimationFrame(followMouse);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-[30px] h-[30px] rounded-full border border-[var(--brand-yellow)] pointer-events-none z-[99999]"
      style={{ transform: "translate3d(-100px, -100px, 0)", marginLeft: "-15px", marginTop: "-15px" }}
    />
  );
}
