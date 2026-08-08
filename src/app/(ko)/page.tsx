import type { Metadata } from "next";
import HomePage from "@/components/site/HomePage";
import { homeMetadata } from "@/lib/seo";

export const metadata: Metadata = homeMetadata("ko");

export default function Page() {
  return <HomePage lang="ko" />;
}
