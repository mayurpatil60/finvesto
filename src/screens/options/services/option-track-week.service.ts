const BASE_URL = "https://finvesto-backend-y9ly.onrender.com";

export class OptionTrackWeekService {
  private static instance: OptionTrackWeekService;
  static getInstance() {
    if (!OptionTrackWeekService.instance)
      OptionTrackWeekService.instance = new OptionTrackWeekService();
    return OptionTrackWeekService.instance;
  }

  /** GET /options/option-track-week/batch/ids */
  async getBatchIds(): Promise<{ data: string[] }> {
    const res = await fetch(`${BASE_URL}/options/option-track-week/batch/ids`);
    if (!res.ok) throw new Error(`Failed to fetch batch ids: ${res.status}`);
    return res.json();
  }

  /** GET /options/option-track-week/batch?batchId=... */
  async getBatch(batchId: string): Promise<{ data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/options/option-track-week/batch?batchId=${encodeURIComponent(batchId)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch batch: ${res.status}`);
    return res.json();
  }

  /** GET /options/option-track-week?expiryDate=YYYY-MM-DD */
  async fetchFresh(
    expiryDate: string,
  ): Promise<{ batch_id: string; count: number }> {
    const res = await fetch(
      `${BASE_URL}/options/option-track-week?expiryDate=${encodeURIComponent(expiryDate)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch fresh data: ${res.status}`);
    return res.json();
  }

  /** DELETE /options/option-track-week/batch?batchId=... */
  async deleteBatch(batchId: string): Promise<{ deletedCount: number }> {
    const res = await fetch(
      `${BASE_URL}/options/option-track-week/batch?batchId=${encodeURIComponent(batchId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) throw new Error(`Failed to delete batch: ${res.status}`);
    return res.json();
  }
}

export const optionTrackWeekService = OptionTrackWeekService.getInstance();
