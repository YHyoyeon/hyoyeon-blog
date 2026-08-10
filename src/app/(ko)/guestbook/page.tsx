import type { Metadata } from "next";
import GuestbookPage from "@/components/site/GuestbookPage";
import { guestbookMetadata } from "@/lib/seo";

export const metadata: Metadata = guestbookMetadata("ko");

export default function Page() {
  return <GuestbookPage lang="ko" />;
}
