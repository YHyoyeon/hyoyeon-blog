import type { Metadata } from "next";
import GuestbookPage from "@/components/site/GuestbookPage";
import { guestbookMetadata } from "@/lib/seo";

export const metadata: Metadata = guestbookMetadata("en");

export default function Page() {
  return <GuestbookPage lang="en" />;
}
