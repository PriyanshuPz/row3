import { useEffect, useRef } from "react";
import rough from "roughjs";

export default function XO({
  type,
  color = "#41bdd6",
  size = 80,
}: {
  type: "X" | "O";
  color?: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rc = rough.canvas(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);

    if (type === "X") {
      rc.line(10, 10, size - 10, size - 10, {
        stroke: color,
        strokeWidth: 3,
        roughness: 2,
      });
      rc.line(size - 10, 10, 10, size - 10, {
        stroke: color,
        strokeWidth: 3,
        roughness: 2,
      });
    } else if (type === "O") {
      rc.circle(size / 2, size / 2, size - 20, {
        stroke: color,
        strokeWidth: 3,
        roughness: 2,
      });
    }
  }, [type, color, size]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
