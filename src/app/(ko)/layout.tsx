import "../globals.css";
import type { Metadata } from "next";
import BaseHtml from "@/components/site/BaseHtml";
import { rootMetadata } from "@/lib/seo";

export const metadata: Metadata = rootMetadata("ko");

export default function KoLayout({ children }: { children: React.ReactNode }) {
  return <BaseHtml lang="ko">{children}</BaseHtml>;
}
