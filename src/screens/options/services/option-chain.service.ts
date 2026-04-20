// ─── Option Chain Service ──────────────────────────────────────────────────────

const BASE_URL = "https://finvesto-backend-y9ly.onrender.com";

export class OptionChainService {
  private static instance: OptionChainService;
  static getInstance() {
    if (!OptionChainService.instance)
      OptionChainService.instance = new OptionChainService();
    return OptionChainService.instance;
  }

  /** GET /api/config/expiry */
  async getExpiry(): Promise<{ expiryDate: string }> {
    const res = await fetch(`${BASE_URL}/api/config/expiry`);
    if (!res.ok) throw new Error(`Failed to fetch expiry: ${res.status}`);
    return res.json();
  }

  /** GET /options/option-chain?ticker=...&expiryDate=... */
  async getOptionChain(
    ticker: string,
    expiryDate: string,
  ): Promise<{ data: any }> {
    const res = await fetch(
      `${BASE_URL}/options/option-chain?ticker=${encodeURIComponent(ticker)}&expiryDate=${encodeURIComponent(expiryDate)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch option chain: ${res.status}`);
    return res.json();
  }
}

export const optionChainService = OptionChainService.getInstance();
