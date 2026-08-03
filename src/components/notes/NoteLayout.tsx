import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export const NoteHeader = ({ title, intro }: { title: string; intro: string }) => (
  <>
    <Link
      href="/"
      className="font-mono text-[13px] text-muted-foreground hover:text-accent transition-colors"
    >
      ← 목록
    </Link>

    <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
    <p className="mt-4 text-muted-foreground leading-relaxed break-keep">{intro}</p>
  </>
);

export const SectionLabel = ({ children }: { children: string }) => (
  <p className="section-title">{children}</p>
);

export const NoteSection = ({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) => (
  <section className="mt-16">
    <SectionLabel>{label}</SectionLabel>
    <h2 className="text-xl font-semibold mb-6">{title}</h2>
    {children}
  </section>
);

export const KeyPointList = ({
  items,
}: {
  items: { icon: LucideIcon; title: string; body: string }[];
}) => (
  <div className="rounded-lg border border-border divide-y divide-border">
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <div key={item.title} className="flex gap-4 p-5">
          <span className="shrink-0 w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <Icon size={17} />
          </span>
          <div>
            <h3 className="font-semibold text-sm pt-1.5">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed break-keep">{item.body}</p>
          </div>
        </div>
      );
    })}
  </div>
);

export const StepList = ({ steps }: { steps: { title: string; body: string }[] }) => (
  <ol className="space-y-5">
    {steps.map((step, i) => (
      <li key={step.title} className="flex gap-4">
        <span className="shrink-0 w-6 h-6 rounded-full border border-accent/40 text-accent text-xs font-mono flex items-center justify-center mt-0.5">
          {i}
        </span>
        <div>
          <p className="text-sm font-semibold">{step.title}</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed break-keep">{step.body}</p>
        </div>
      </li>
    ))}
  </ol>
);

type IconListTone = "accent" | "destructive" | "muted";

const toneClass: Record<IconListTone, string> = {
  accent: "text-accent",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

export const IconList = ({
  items,
  icon: Icon,
  tone,
}: {
  items: string[];
  icon: LucideIcon;
  tone: IconListTone;
}) => (
  <ul className="space-y-3">
    {items.map((item) => (
      <li key={item} className="flex gap-3">
        <Icon size={18} className={`shrink-0 mt-0.5 ${toneClass[tone]}`} />
        <p className="text-sm text-muted-foreground leading-relaxed break-keep">{item}</p>
      </li>
    ))}
  </ul>
);
