"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";

let mermaidIdCounter = 0;

const MermaidDiagram = ({ chart }: { chart: string }) => {
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState("");
  const idRef = useRef(`note-mermaid-${mermaidIdCounter++}`);

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

  return (
    <div
      className="w-full overflow-x-auto rounded-lg border border-border bg-secondary/20 p-4 [&_svg]:mx-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
