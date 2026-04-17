// ─── Analysis Service ─────────────────────────────────────────────────────────

const BASE_URL = "https://finvesto-backend-y9ly.onrender.com";

export class AnalysisService {
  private static instance: AnalysisService;
  static getInstance() {
    if (!AnalysisService.instance)
      AnalysisService.instance = new AnalysisService();
    return AnalysisService.instance;
  }

  /** GET /analysis/batch/ids */
  async getBatchIds(): Promise<{ data: string[] }> {
    const res = await fetch(`${BASE_URL}/analysis/batch/ids`);
    if (!res.ok) throw new Error(`Failed to fetch batch ids: ${res.status}`);
    return res.json();
  }

  /** GET /analysis/batch?batchId=... */
  async getBatch(batchId: string): Promise<{ data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/analysis/batch?batchId=${encodeURIComponent(batchId)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch batch: ${res.status}`);
    return res.json();
  }

  /** GET /analysis/by-name?name=... */
  async getByName(name: string): Promise<{ data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/analysis/by-name?name=${encodeURIComponent(name)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch by name: ${res.status}`);
    return res.json();
  }

  /** GET /api/option-chain?symbols=...&expiry=... */
  async getOptionChain(
    symbols: string,
    expiry: string,
  ): Promise<{ data: any }> {
    const res = await fetch(
      `${BASE_URL}/api/option-chain?symbols=${encodeURIComponent(symbols)}&expiry=${encodeURIComponent(expiry)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch option chain: ${res.status}`);
    return res.json();
  }

  /** GET /api/config/expiry */
  async getExpiry(): Promise<{ expiryDate: string | null }> {
    const res = await fetch(`${BASE_URL}/api/config/expiry`);
    if (!res.ok) throw new Error(`Failed to fetch expiry: ${res.status}`);
    return res.json();
  }
}

export const analysisService = AnalysisService.getInstance();
