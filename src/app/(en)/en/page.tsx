import type { Metadata } from "next";
import HomePage from "@/components/site/HomePage";
import { homeMetadata } from "@/lib/seo";

export const metadata: Metadata = homeMetadata("en");

export default function Page() {
  return <HomePage lang="en" />;
}
