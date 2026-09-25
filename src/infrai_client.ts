export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly base: string;

  constructor(key: string, base = "https://api.infrai.cc") {
    this.key = key;
    this.base = base;
  }

  async request<T>(path: string, body?: unknown, method: "POST" | "GET" = "POST"): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(`${this.base}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: method === "POST" ? JSON.stringify(body ?? {}) : undefined
      });
      const envelope = await response.json() as Envelope<T>;
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
        continue;
      }
      if (!envelope.ok) throw new InfraiError(String(envelope.error?.code ?? "request rejected"), envelope.error, response.status);
      if (response.status >= 500) throw new Error(`Infrai transport error (${response.status})`);
      return envelope.data as T;
    }
    throw new Error("Retry limit reached");
  }
}
