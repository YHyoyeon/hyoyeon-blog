import { NextResponse, type NextRequest } from "next/server";
import { getRedis } from "@/lib/redis";
import { notes } from "@/lib/notes";

/**
 * 조회수 카운터.
 * INCR은 원자적이라 동시 접속에도 카운트가 유실되지 않는다.
 * Blob이나 파일로 read→+1→write 하면 이 지점에서 경쟁 조건이 생긴다.
 */

// ioredis는 node:net을 쓰므로 edge 런타임에서 동작하지 않는다.
export const runtime = "nodejs";

/** 사이트 전체 방문자 카운터의 키. 글 slug와 겹치지 않는다. */
const SITE_KEY = "site";

/**
 * 이미 센 대상을 담아 두는 세션 쿠키. `slug1.slug2.site` 형태다.
 * Max-Age를 주지 않아 브라우저를 닫으면 사라지고, 다음 방문에 다시 한 번씩 센다.
 *
 * ponytail: 한 세션에서 읽은 글 수만큼 커진다(15편 다 읽어도 ≈ 300B, 쿠키 한도 4KB).
 * 글이 수백 편이 되면 세션 ID 쿠키 1개 + Redis `SET NX EX` 방식으로 바꿔야 한다.
 */
const SESSION_COOKIE = "visited";
const SEPARATOR = ".";

/** 임의의 slug로 키를 무한정 만들어 용량을 태우지 못하게 화이트리스트로 막는다. */
const allowedKeys = new Set([...notes.map((n) => n.slug), SITE_KEY]);

export async function POST(request: NextRequest, ctx: RouteContext<"/api/views/[slug]">) {
  const { slug } = await ctx.params;
  if (!allowedKeys.has(slug)) return NextResponse.json({ views: null }, { status: 404 });

  const redis = getRedis();
  if (!redis) return NextResponse.json({ views: null }, { status: 503 });

  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const visited = new Set(raw ? raw.split(SEPARATOR).filter(Boolean) : []);

  try {
    // 이번 세션에서 이미 센 대상이면 올리지 않고 현재 값만 읽어서 돌려준다.
    if (visited.has(slug)) {
      const current = Number(await redis.get(`views:${slug}`));
      // 키가 없으면 GET이 null → Number(null) === 0. 그 외 숫자가 아니면 표시를 포기한다.
      return NextResponse.json({ views: Number.isFinite(current) ? current : null });
    }

    const views = await redis.incr(`views:${slug}`);
    visited.add(slug);

    const response = NextResponse.json({ views });
    response.cookies.set(SESSION_COOKIE, [...visited].join(SEPARATOR), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch {
    return NextResponse.json({ views: null }, { status: 502 });
  }
}
