import { ogImage, size, contentType } from "@/lib/og";
import { dict } from "@/lib/i18n";

export const alt = "YHyoyeon Blog";
export { size, contentType };

export default async function Image() {
  return ogImage({
    title: "Notes on real engineering problems solved in production",
    tag: dict.en.footerTagline,
  });
}
