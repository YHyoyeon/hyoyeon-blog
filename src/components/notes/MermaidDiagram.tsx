"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

let mermaidIdCounter = 0;

const MIN = 0.5;
const MAX = 3;
const STEP = 0.25;

const MermaidDiagram = ({ chart }: { chart: string }) => {
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState("");
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const idRef = useRef(`note-mermaid-${mermaidIdCounter++}`);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === "dark" ? "dark" : "default",
      securityLevel: "strict",
      fontFamily: "inherit",
    });

    mermaid.render(idRef.current, chart).then(({ svg: rendered }) => {
      if (!cancelled) setSvg(rendered);
    });

    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else boxRef.current?.requestFullscreen();
  };

  const btn =
    "flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-muted-foreground shadow-sm transition-colors hover:text-foreground";

  return (
    <div
      ref={boxRef}
      className="relative rounded-2xl bg-secondary/50 [&:fullscreen]:overflow-auto [&:fullscreen]:rounded-none [&:fullscreen]:bg-background"
    >
      {/* controls */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
        <button type="button" aria-label="축소" onClick={() => setScale((s) => Math.max(MIN, s - STEP))} className={btn}>
          <ZoomOut size={15} />
        </button>
        <button
          type="button"
          aria-label="배율 초기화"
          onClick={() => setScale(1)}
          className="h-8 rounded-lg bg-background/80 px-2 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          {Math.round(scale * 100)}%
        </button>
        <button type="button" aria-label="확대" onClick={() => setScale((s) => Math.min(MAX, s + STEP))} className={btn}>
          <ZoomIn size={15} />
        </button>
        <button type="button" aria-label={isFullscreen ? "전체화면 닫기" : "전체화면"} onClick={toggleFullscreen} className={btn}>
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      <div className="overflow-auto p-4 pt-14">
        <div
          style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: "100%" }}
          className="[&_svg]:!max-w-none [&_svg]:w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
};

export default MermaidDiagram;
