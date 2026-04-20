const BASE_URL = "https://finvesto-backend-y9ly.onrender.com";

export class OptionTrackService {
  private static instance: OptionTrackService;
  static getInstance() {
    if (!OptionTrackService.instance)
      OptionTrackService.instance = new OptionTrackService();
    return OptionTrackService.instance;
  }

  /** GET /options/option-track/batch/ids */
  async getBatchIds(): Promise<{ data: string[] }> {
    const res = await fetch(`${BASE_URL}/options/option-track/batch/ids`);
    if (!res.ok) throw new Error(`Failed to fetch batch ids: ${res.status}`);
    return res.json();
  }

  /** GET /options/option-track/batch?batchId=... */
  async getBatch(batchId: string): Promise<{ data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/options/option-track/batch?batchId=${encodeURIComponent(batchId)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch batch: ${res.status}`);
    return res.json();
  }

  /** GET /options/option-track — fetch fresh data and save to DB */
  async fetchFresh(): Promise<{ batch_id: string; count: number }> {
    const res = await fetch(`${BASE_URL}/options/option-track`);
    if (!res.ok) throw new Error(`Failed to fetch fresh data: ${res.status}`);
    return res.json();
  }

  /** DELETE /analysis/option-track/batch?batchId=... */
  async deleteBatch(batchId: string): Promise<{ deletedCount: number }> {
    const res = await fetch(
      `${BASE_URL}/analysis/option-track/batch?batchId=${encodeURIComponent(batchId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) throw new Error(`Failed to delete batch: ${res.status}`);
    return res.json();
  }
}

export const optionTrackService = OptionTrackService.getInstance();
