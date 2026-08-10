import { NextResponse, type NextRequest } from "next/server";
import { getRedis } from "@/lib/redis";
import { CONTACT_EMAIL } from "@/lib/i18n";

/**
 * 연락 폼 → Resend REST API로 메일 발송. SDK 없이 fetch 한 번으로 끝난다.
 * RESEND_API_KEY는 서버 전용이라 브라우저에 노출되지 않는다.
 *
 * 도메인을 붙이지 않았으면 from은 onboarding@resend.dev만 쓸 수 있고,
 * 그 경우 Resend 계정 소유자 주소로만 배달된다 — 받는 사람이 본인이라 문제 없다.
 */
export const runtime = "nodejs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM ?? "YHyoyeon Blog <onboarding@resend.dev>";

const MAX = { name: 80, email: 160, message: 4000 };
const MIN_MESSAGE = 10;
/** 한 IP당 시간당 허용 건수. */
const RATE_LIMIT = 5;

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/**
 * IP 단위 시간당 제한. Redis가 죽어 있으면 통과시킨다(fail open) —
 * 레이트리밋 때문에 연락 폼 자체가 막히는 게 더 나쁘다.
 */
async function overRateLimit(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const key = `contact:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 3600);
    return count > RATE_LIMIT;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!RESEND_API_KEY) return NextResponse.json({ error: "unconfigured" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // 허니팟: 사람 눈에 안 보이는 필드라 채워져 있으면 봇이다. 성공처럼 응답해 재시도를 유도하지 않는다.
  if (typeof body.nickname === "string" && body.nickname.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (
    !name ||
    name.length > MAX.name ||
    !looksLikeEmail(email) ||
    email.length > MAX.email ||
    message.length < MIN_MESSAGE ||
    message.length > MAX.message
  ) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (await overRateLimit(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [CONTACT_EMAIL],
      // 답장을 누르면 보낸 사람에게 가도록. from은 검증된 주소여야 해서 바꿀 수 없다.
      reply_to: email,
      subject: `[블로그 문의] ${name}`,
      text: `${name} <${email}>\n\n${message}`,
    }),
  });

  if (!sent.ok) return NextResponse.json({ error: "send_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
