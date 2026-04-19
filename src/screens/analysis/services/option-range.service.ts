// ─── Option Range Service ─────────────────────────────────────────────────────

const BASE_URL = "https://finvesto-backend-y9ly.onrender.com";

export class OptionRangeService {
  private static instance: OptionRangeService;
  static getInstance() {
    if (!OptionRangeService.instance)
      OptionRangeService.instance = new OptionRangeService();
    return OptionRangeService.instance;
  }

  /** GET /analysis/option-range/batch/ids */
  async getBatchIds(): Promise<{ data: string[] }> {
    const res = await fetch(`${BASE_URL}/analysis/option-range/batch/ids`);
    if (!res.ok) throw new Error(`Failed to fetch batch ids: ${res.status}`);
    return res.json();
  }

  /** GET /analysis/option-range/batch?batchId=... */
  async getBatch(batchId: string): Promise<{ data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/analysis/option-range/batch?batchId=${encodeURIComponent(batchId)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch batch: ${res.status}`);
    return res.json();
  }

  /** GET /analysis/option-range — fetch fresh data and save to DB */
  async fetchFresh(): Promise<{ batch_id: string; count: number }> {
    const res = await fetch(`${BASE_URL}/analysis/option-range`);
    if (!res.ok) throw new Error(`Failed to fetch fresh data: ${res.status}`);
    return res.json();
  }

  /** DELETE /analysis/option-range/batch?batchId=... */
  async deleteBatch(batchId: string): Promise<{ deletedCount: number }> {
    const res = await fetch(
      `${BASE_URL}/analysis/option-range/batch?batchId=${encodeURIComponent(batchId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) throw new Error(`Failed to delete batch: ${res.status}`);
    return res.json();
  }
}

export const optionRangeService = OptionRangeService.getInstance();
