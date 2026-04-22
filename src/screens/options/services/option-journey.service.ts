// ─── Option Journey Service ───────────────────────────────────────────────────

const BASE_URL = "https://finvesto-backend-y9ly.onrender.com";

export class OptionJourneyService {
  private static instance: OptionJourneyService;
  static getInstance() {
    if (!OptionJourneyService.instance)
      OptionJourneyService.instance = new OptionJourneyService();
    return OptionJourneyService.instance;
  }

  /** GET /options/option-journey/batch/ids */
  async getBatchIds(): Promise<{ data: string[] }> {
    const res = await fetch(`${BASE_URL}/options/option-journey/batch/ids`);
    if (!res.ok) throw new Error(`Failed to fetch batch ids: ${res.status}`);
    return res.json();
  }

  /** GET /options/option-journey/batch?batchId=... */
  async getBatch(batchId: string): Promise<{ data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/options/option-journey/batch?batchId=${encodeURIComponent(batchId)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch batch: ${res.status}`);
    return res.json();
  }

  /** GET /options/option-journey — fetch fresh data and save to DB */
  async fetchFresh(): Promise<{ batch_id: string; count: number }> {
    const res = await fetch(`${BASE_URL}/options/option-journey`);
    if (!res.ok) throw new Error(`Failed to fetch fresh data: ${res.status}`);
    return res.json();
  }

  /** DELETE /options/option-journey/batch?batchId=... */
  async deleteBatch(batchId: string): Promise<{ deletedCount: number }> {
    const res = await fetch(
      `${BASE_URL}/options/option-journey/batch?batchId=${encodeURIComponent(batchId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) throw new Error(`Failed to delete batch: ${res.status}`);
    return res.json();
  }
}

export const optionJourneyService = OptionJourneyService.getInstance();
