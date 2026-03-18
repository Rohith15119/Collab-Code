import { useState, useRef } from "react";

export default function ResizablePanels({ left, middle, right }) {
  const containerRef = useRef(null);

  const [leftWidth, setLeftWidth] = useState(50); // %
  const [middleWidth, setMiddleWidth] = useState(25);

  const dragging = useRef(null);

  const onMouseMove = (e) => {
    if (!dragging.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;

    if (dragging.current === "left") {
      setLeftWidth(Math.min(Math.max(percent, 20), 70));
    }

    if (dragging.current === "middle") {
      const newMiddle = percent - leftWidth;
      if (newMiddle > 15 && newMiddle < 50) {
        setMiddleWidth(newMiddle);
      }
    }
  };

  const stopDrag = () => (dragging.current = null);

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      className="flex h-full w-full"
    >
      {/* LEFT (EDITOR) */}
      <div style={{ width: `${leftWidth}%` }}>{left}</div>

      {/* RESIZER 1 */}
      <div
        onMouseDown={() => (dragging.current = "left")}
        className="w-1 bg-gray-700 cursor-col-resize hover:bg-green-500"
      />

      {/* MIDDLE (INPUT) */}
      <div style={{ width: `${middleWidth}%` }}>{middle}</div>

      {/* RESIZER 2 */}
      <div
        onMouseDown={() => (dragging.current = "middle")}
        className="w-1 bg-gray-700 cursor-col-resize hover:bg-green-500"
      />

      {/* RIGHT (OUTPUT) */}
      <div style={{ flex: 1 }}>{right}</div>
    </div>
  );
}
