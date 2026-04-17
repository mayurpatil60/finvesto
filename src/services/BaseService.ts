// ─── Base Service ─────────────────────────────────────────────────────────────
// All services extend this base, similar to Angular's service pattern.

export abstract class BaseService {
  protected readonly baseUrl: string = "";

  protected async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok)
      throw new Error(`GET ${endpoint} failed: ${response.status}`);
    return response.json() as Promise<T>;
  }

  protected async post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok)
      throw new Error(`POST ${endpoint} failed: ${response.status}`);
    return response.json() as Promise<T>;
  }
}
