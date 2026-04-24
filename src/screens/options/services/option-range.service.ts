// ─── Option Range Service ─────────────────────────────────────────────────────

import { environment } from "../../../environments/environment";
const BASE_URL = environment.ENDPOINTS.NODE.BASE_URL;

export class OptionRangeService {
  private static instance: OptionRangeService;
  static getInstance() {
    if (!OptionRangeService.instance)
      OptionRangeService.instance = new OptionRangeService();
    return OptionRangeService.instance;
  }

  /** GET /options/option-range/batch/ids */
  async getBatchIds(): Promise<{ data: string[] }> {
    const res = await fetch(`${BASE_URL}/options/option-range/batch/ids`);
    if (!res.ok) throw new Error(`Failed to fetch batch ids: ${res.status}`);
    return res.json();
  }

  /** GET /options/option-range/batch?batchId=... */
  async getBatch(batchId: string): Promise<{ data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/options/option-range/batch?batchId=${encodeURIComponent(batchId)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch batch: ${res.status}`);
    return res.json();
  }

  /** GET /options/option-range — fetch fresh data and save to DB */
  async fetchFresh(): Promise<{ batch_id: string; count: number }> {
    const res = await fetch(`${BASE_URL}/options/option-range`);
    if (!res.ok) throw new Error(`Failed to fetch fresh data: ${res.status}`);
    return res.json();
  }

  /** DELETE /options/option-range/batch?batchId=... */
  async deleteBatch(batchId: string): Promise<{ deletedCount: number }> {
    const res = await fetch(
      `${BASE_URL}/options/option-range/batch?batchId=${encodeURIComponent(batchId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) throw new Error(`Failed to delete batch: ${res.status}`);
    return res.json();
  }
}

export const optionRangeService = OptionRangeService.getInstance();
