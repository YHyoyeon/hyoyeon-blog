import { NextResponse } from "next/server";
import Redis from "ioredis";
import { notes } from "@/lib/notes";

/**
 * 조회수 카운터. Redis Cloud(Vercel Marketplace의 "Redis") 에 TCP로 붙는다.
 *
 * 환경변수는 Vercel이 리소스를 프로젝트에 Connect 할 때 주입한다. 이름이 다르면
 * (대시보드 Environment Variables에서 확인) 아래 한 줄만 바꾸면 된다.
 *
 * INCR은 원자적이라 동시 접속에도 카운트가 유실되지 않는다.
 * Blob이나 파일로 read→+1→write 하면 이 지점에서 경쟁 조건이 생긴다.
 */
const REDIS_URL = process.env.REDIS_URL;

// ioredis는 node:net을 쓰므로 edge 런타임에서 동작하지 않는다.
export const runtime = "nodejs";

/** 임의의 slug로 키를 무한정 만들어 용량을 태우지 못하게 화이트리스트로 막는다. */
const allowedKeys = new Set([...notes.map((n) => n.slug), "guestbook"]);

/**
 * 커넥션은 모듈 스코프에 두고 웜 인스턴스가 사는 동안 재사용한다.
 * 요청마다 새로 연결하면 무료 플랜의 커넥션 30개를 금방 소진한다.
 */
let client: Redis | null = null;

function getClient(): Redis | null {
  if (!REDIS_URL) return null;
  if (!client) {
    client = new Redis(REDIS_URL, {
      // 재연결을 1회까지만 시도하고, 초과하면 대기 중인 명령을 에러로 흘려보낸다.
      // 서버리스 요청이 죽은 Redis를 기다리며 매달리지 않게 하는 상한선.
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      // offline queue는 켜 둔다(기본값). 콜드 스타트 직후 커넥션이 붙기 전에 들어온
      // 첫 요청을 큐에 담았다가 연결되면 실행한다 — 끄면 첫 방문자의 카운트가 유실된다.
    });
    // 핸들러가 없으면 연결 오류가 unhandled 'error'로 올라와 프로세스를 죽인다.
    client.on("error", () => {});
  }
  return client;
}

export async function POST(_request: Request, ctx: RouteContext<"/api/views/[slug]">) {
  const { slug } = await ctx.params;
  if (!allowedKeys.has(slug)) return NextResponse.json({ views: null }, { status: 404 });

  const redis = getClient();
  if (!redis) return NextResponse.json({ views: null }, { status: 503 });

  // ponytail: 호출 제한 없음 — 새로고침하면 그만큼 올라간다. 어뷰징이 눈에 띄면 IP 단위 SETNX 하루 만료를 얹으면 된다.
  try {
    const views = await redis.incr(`views:${slug}`);
    return NextResponse.json({ views });
  } catch {
    return NextResponse.json({ views: null }, { status: 502 });
  }
}
