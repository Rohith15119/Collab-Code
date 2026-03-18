import { useState, useRef, useEffect, useCallback } from "react";

export default function ResizablePanels({ left, middle, right }) {
  const containerRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(50);
  const [middleWidth, setMiddleWidth] = useState(25);
  const dragging = useRef(null);

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const onMouseMove = useCallback(
    (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;

      if (dragging.current === "left") {
        const clamped = clamp(percent, 20, 70);
        const rightWidth = 100 - clamped - middleWidth;
        if (rightWidth < 15) return;
        setLeftWidth(clamped);
      }

      if (dragging.current === "middle") {
        const newMiddle = percent - leftWidth;
        const newRight = 100 - leftWidth - newMiddle;
        if (newMiddle >= 15 && newRight >= 15) {
          setMiddleWidth(newMiddle);
        }
      }
    },
    [leftWidth, middleWidth],
  );

  const stopDrag = useCallback(() => {
    dragging.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const startDrag = useCallback((type) => {
    dragging.current = type;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [onMouseMove, stopDrag]);

  const rightWidth = 100 - leftWidth - middleWidth;

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      {/* LEFT — Editor */}
      <div
        className="h-full overflow-hidden min-w-0"
        style={{ width: `${leftWidth}%`, flexShrink: 0 }}
      >
        {left}
      </div>

      {/* RESIZER 1 */}
      <div
        onMouseDown={() => startDrag("left")}
        className="relative w-1 shrink-0 bg-gray-800 hover:bg-green-500 active:bg-green-400 cursor-col-resize transition-colors duration-150 group"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
      </div>

      {/* MIDDLE — Input */}
      <div
        className="h-full overflow-hidden min-w-0"
        style={{ width: `${middleWidth}%`, flexShrink: 0 }}
      >
        {middle}
      </div>

      {/* RESIZER 2 */}
      <div
        onMouseDown={() => startDrag("middle")}
        className="relative w-1 shrink-0 bg-gray-800 hover:bg-green-500 active:bg-green-400 cursor-col-resize transition-colors duration-150 group"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
      </div>

      {/* RIGHT — Output */}
      <div
        className="h-full overflow-hidden min-w-0"
        style={{ width: `${rightWidth}%`, flexShrink: 0 }}
      >
        {right}
      </div>
    </div>
  );
}
