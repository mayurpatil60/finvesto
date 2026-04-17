// ─── Markets Service ──────────────────────────────────────────────────────────

const BASE_URL = "https://finvesto-backend-y9ly.onrender.com";

export interface IpoUpcomingItem {
  companyName: string;
  ipoOpenDate: string;
  ipoCloseDate: string;
  issuePriceBand: string;
  ipoSize: string;
  exchange: string;
}

export interface IpoListedItem {
  companyName: string;
  ipoOpenDate: string;
  listingDate: string;
  issuePrice: string;
  listingPrice: string;
  listingGains: string;
  exchange: string;
}

export interface FundamentalsItem {
  [key: string]: any;
}

export interface InvestmentItem {
  stock_name: string;
  ticker: string;
  percentage?: number | string;
  [key: string]: any;
}

export class MarketsService {
  private static instance: MarketsService;
  static getInstance() {
    if (!MarketsService.instance)
      MarketsService.instance = new MarketsService();
    return MarketsService.instance;
  }

  // ── IPO ──────────────────────────────────────────────────────────────────────

  async getIpoUpcoming(): Promise<{ status: string; data: any }> {
    const res = await fetch(`${BASE_URL}/api/ipo-upcoming`);
    if (!res.ok)
      throw new Error(`Failed to fetch upcoming IPOs: ${res.status}`);
    return res.json();
  }

  async getIpoListed(year: number): Promise<{ status: string; data: any[] }> {
    const res = await fetch(`${BASE_URL}/api/ipo-listed?year=${year}`);
    if (!res.ok) throw new Error(`Failed to fetch listed IPOs: ${res.status}`);
    return res.json();
  }

  // ── Fundamentals ─────────────────────────────────────────────────────────────

  async getFundamentals(
    params: Record<string, string>,
  ): Promise<{ status: string; data: any[] }> {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/api/fundamentals?${qs}`);
    if (!res.ok) throw new Error(`Failed to fetch fundamentals: ${res.status}`);
    return res.json();
  }

  // ── Investments ───────────────────────────────────────────────────────────────

  async getInvestments(
    type: string,
    segment: string,
    timeframe: string,
  ): Promise<{ status: string; data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/api/investments?type=${encodeURIComponent(type)}&segment=${encodeURIComponent(segment)}&timeframe=${encodeURIComponent(timeframe)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch investments: ${res.status}`);
    return res.json();
  }
}

export const marketsService = MarketsService.getInstance();
