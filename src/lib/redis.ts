import Redis from "ioredis";

/**
 * Redis Cloud(Vercel Marketplace의 "Redis") 커넥션. 환경변수는 리소스를 프로젝트에
 * Connect 할 때 주입된다. 이름이 다르면 이 줄만 바꾸면 된다.
 *
 * 커넥션은 모듈 스코프에 하나만 두고 웜 인스턴스가 사는 동안 재사용한다.
 * 라우트마다 따로 만들거나 요청마다 새로 열면 무료 플랜의 커넥션 30개를 금방 소진한다.
 * ioredis는 node:net을 쓰므로 이걸 쓰는 라우트는 `runtime = "nodejs"`여야 한다.
 */
const REDIS_URL = process.env.REDIS_URL;

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (!REDIS_URL) return null;
  if (!client) {
    client = new Redis(REDIS_URL, {
      // 재연결을 1회까지만 시도하고, 초과하면 대기 중인 명령을 에러로 흘려보낸다.
      // 서버리스 요청이 죽은 Redis를 기다리며 매달리지 않게 하는 상한선.
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      // offline queue는 켜 둔다(기본값). 콜드 스타트 직후 커넥션이 붙기 전에 들어온
      // 첫 요청을 큐에 담았다가 연결되면 실행한다 — 끄면 첫 요청이 유실된다.
    });
    // 핸들러가 없으면 연결 오류가 unhandled 'error'로 올라와 프로세스를 죽인다.
    client.on("error", () => {});
  }
  return client;
}
