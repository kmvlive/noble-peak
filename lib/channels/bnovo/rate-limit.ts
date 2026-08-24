/**
 * Простой окно-счётчик троттлинга для запросов к Bnovo.
 *
 * Лимиты Bnovo:
 *  - авторизация (/api/v1/auth): не более 10 в минуту;
 *  - остальные методы: 30 за 10 сек, 300 за 5 мин, 1000 в час, 10000 в сутки;
 *  - при превышении 429 — повторный запрос через 1 минуту.
 *
 * Планировщик держит таймстампы последних вызовов и, при приближении к лимиту,
 * «спит» до освобождения окна. Это гарантирует соблюдение лимитов даже при
 * активной синхронизации.
 */

export interface RateLimitWindow {
  limit: number;
  windowMs: number;
}

const WINDOWS: RateLimitWindow[] = [
  { limit: 30, windowMs: 10_000 },
  { limit: 300, windowMs: 300_000 },
  { limit: 1000, windowMs: 3_600_000 },
  { limit: 10_000, windowMs: 86_400_000 },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class RateLimiter {
  private timestamps: number[] = [];

  constructor(private readonly options: { maxAuthPerMinute?: number } = {}) {}

  async acquire(kind: "auth" | "regular"): Promise<void> {
    if (kind === "auth") {
      await this.throttleForAuth();
      return;
    }
    await this.throttleForRegular();
  }

  /** Держит запрос до тех пор, пока в каждом окне есть слот. */
  private async throttleForRegular(): Promise<void> {
    const now = Date.now();
    for (;;) {
      const clean = this.timestamps.filter((t) => now - t < 86_400_000);
      const conflicts = WINDOWS.filter((w) => {
        const within = clean.filter((t) => now - t < w.windowMs).length;
        return within >= w.limit;
      });
      if (conflicts.length === 0) {
        this.timestamps = [...clean, now];
        return;
      }
      const oldest = Math.max(0, ...clean.map((t) => now - t + 86_400_000));
      await sleep(oldest > 0 ? Math.min(oldest, 60_000) : 1_000);
    }
  }

  private async throttleForAuth(): Promise<void> {
    const max = this.options.maxAuthPerMinute ?? 10;
    const now = Date.now();
    for (;;) {
      const withinMinute = this.timestamps.filter(
        (t) => now - t < 60_000
      ).length;
      if (withinMinute < max) {
        this.timestamps.push(now);
        return;
      }
      await sleep(2_000);
    }
  }
}
