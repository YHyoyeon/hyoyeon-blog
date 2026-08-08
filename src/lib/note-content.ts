import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Lang } from "@/lib/i18n";

/** 노트 본문을 언어별 데이터로 표현하는 스키마. 렌더러는 NotePage 하나뿐이라 ko/en 구조가 강제로 같아진다. */
export type Block =
  | { kind: "prose"; paragraphs: string[] }
  | { kind: "steps"; steps: { title: string; body: string }[] }
  | { kind: "keypoints"; items: { icon: LucideIcon; title: string; body: string }[] }
  | { kind: "list"; icon: LucideIcon; tone: "accent" | "destructive" | "muted"; items: string[] }
  | { kind: "mermaid"; chart: string }
  | { kind: "code"; code: string }
  // ponytail: escape hatch for the 1 note with bespoke SVG charts; keep schema-driven notes off this.
  | { kind: "custom"; node: ReactNode };

export type Section = { label: string; title: string; blocks: Block[] };
export type NoteBody = { intro: string; sections: Section[] };
export type NoteContent = Record<Lang, NoteBody>;
