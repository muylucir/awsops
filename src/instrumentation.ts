// Next.js instrumentation: runs once on server start
// 서버 시작 시 1회 실행 — 캐시 프리워밍 시작

export async function register() {
  // Only run on server side (not edge runtime) / 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCacheWarmer } = await import('@/lib/cache-warmer');
    startCacheWarmer();
  }
}
