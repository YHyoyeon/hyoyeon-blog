import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * 한글 폰트 전체는 수 MB라 ImageResponse의 500KB 번들 한도를 넘는다.
 * Google Fonts의 `text=` 파라미터로 **실제 쓰이는 글자만** 서브셋으로 받아 해결한다.
 * (한도를 넘기면 조용히 실패하고, 폰트가 없으면 한글이 두부로 렌더된다)
 */
async function loadKoreanFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const api = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`;
    // 구형 UA로 요청해야 woff2 대신 truetype을 준다 — ImageResponse는 ttf/otf/woff만 읽는다.
    const css = await fetch(api, { headers: { "User-Agent": "Mozilla/4.0" } }).then((r) => r.text());
    const url = css.match(/src:\s*url\((https:[^)]+)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    // 폰트를 못 받아도 이미지는 나가는 게 낫다. 라틴 문자는 기본 폰트로 렌더된다.
    return null;
  }
}

/** 모든 OG 이미지가 쓰는 한 장짜리 레이아웃. 제목이 주인공이고 나머지는 최소한으로 둔다. */
export async function ogImage({ title, tag }: { title: string; tag: string }) {
  const label = tag.toUpperCase();
  // 서브셋은 "화면에 실제로 그려지는 문자열" 그대로 요청해야 한다.
  // 원본 tag만 넘기면 대문자로 바꾼 글자가 서브셋에 없어 기본 폰트로 떨어지고 굵기가 튄다.
  const font = await loadKoreanFont(`${title}${label}YHyoyeon Blog /`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0c",
          color: "#fafafa",
          padding: "72px 80px",
          fontFamily: font ? "Noto Sans KR" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#a1a1aa", letterSpacing: 2 }}>
          {label}
        </div>
        <div style={{ display: "flex", fontSize: 64, lineHeight: 1.25, fontWeight: 700 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa" }}>
          YHyoyeon Blog
          <span style={{ color: "#f97316", marginLeft: 12 }}>/</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Noto Sans KR", data: font, style: "normal" as const, weight: 700 as const }]
        : undefined,
    },
  );
}
