import { ogImage, size, contentType } from "@/lib/og";
import { dict } from "@/lib/i18n";

export const alt = "YHyoyeon Blog";
export { size, contentType };

export default async function Image() {
  return ogImage({ title: "실무에서 해결한 기술 문제들의 기록", tag: dict.ko.footerTagline });
}
