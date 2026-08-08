import "../globals.css";
import type { Metadata } from "next";
import BaseHtml from "@/components/site/BaseHtml";
import { rootMetadata } from "@/lib/seo";

export const metadata: Metadata = rootMetadata("en");

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <BaseHtml lang="en">{children}</BaseHtml>;
}
