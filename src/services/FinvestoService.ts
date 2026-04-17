// ─── Finvesto Service ─────────────────────────────────────────────────────────

const BASE_URL = "https://finvesto-backend-y9ly.onrender.com";

export class FinvestoService {
  private static instance: FinvestoService;
  static getInstance() {
    if (!FinvestoService.instance)
      FinvestoService.instance = new FinvestoService();
    return FinvestoService.instance;
  }

  // ── Config ──────────────────────────────────────────────────────────────────

  async getExpiry(): Promise<{ expiryDate: string | null }> {
    const res = await fetch(`${BASE_URL}/api/config/expiry`);
    if (!res.ok) throw new Error(`Failed to fetch expiry: ${res.status}`);
    return res.json();
  }

  async saveExpiry(
    expiryDate: string,
  ): Promise<{ message: string; expiryDate: string }> {
    const res = await fetch(`${BASE_URL}/api/config/expiry/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiryDate }),
    });
    if (!res.ok) throw new Error(`Failed to save expiry: ${res.status}`);
    return res.json();
  }

  // ── Analysis Cleanup ─────────────────────────────────────────────────────────

  async deleteAnalysisByExpiry(
    expiry: string,
  ): Promise<{ status: string; deletedCount: number }> {
    const res = await fetch(
      `${BASE_URL}/analysis/by-expiry?expiry=${encodeURIComponent(expiry)}`,
      {
        method: "DELETE",
      },
    );
    if (!res.ok) throw new Error(`Failed to delete analysis: ${res.status}`);
    return res.json();
  }
}

export const finvestoService = FinvestoService.getInstance();
