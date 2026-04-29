// ─── Markets Service ──────────────────────────────────────────────────────────

import { environment } from "../../../environments/environment";
const BASE_URL = environment.ENDPOINTS.NODE.BASE_URL;

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
    const res = await fetch(`${BASE_URL}/markets/ipo-upcoming`);
    if (!res.ok)
      throw new Error(`Failed to fetch upcoming IPOs: ${res.status}`);
    return res.json();
  }

  async getIpoListed(year: number): Promise<{ status: string; data: any[] }> {
    const res = await fetch(`${BASE_URL}/markets/ipo-listed?year=${year}`);
    if (!res.ok) throw new Error(`Failed to fetch listed IPOs: ${res.status}`);
    return res.json();
  }

  // ── Fundamentals ─────────────────────────────────────────────────────────────

  async getFundamentals(
    params: Record<string, string>,
  ): Promise<{ status: string; data: any[] }> {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/markets/fundamentals?${qs}`);
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
      `${BASE_URL}/markets/investments?type=${encodeURIComponent(type)}&segment=${encodeURIComponent(segment)}&timeframe=${encodeURIComponent(timeframe)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch investments: ${res.status}`);
    return res.json();
  }

  async getInvestmentsFromDb(
    segment: string,
    timeframe: string,
    date: string,
  ): Promise<{ status: string; count: number; data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/markets/investments/db?segment=${encodeURIComponent(segment)}&timeframe=${encodeURIComponent(timeframe)}&date=${encodeURIComponent(date)}`,
    );
    if (!res.ok)
      throw new Error(`Failed to fetch investments from DB: ${res.status}`);
    return res.json();
  }

  async getInvestmentDates(
    segment: string,
    timeframe: string,
  ): Promise<{ status: string; count: number; data: string[] }> {
    const res = await fetch(
      `${BASE_URL}/markets/investments/dates?segment=${encodeURIComponent(segment)}&timeframe=${encodeURIComponent(timeframe)}`,
    );
    if (!res.ok)
      throw new Error(`Failed to fetch investment dates: ${res.status}`);
    return res.json();
  }

  // ── Market Signal ─────────────────────────────────────────────────────────────

  async getMarketSignals(
    timeframe: string,
  ): Promise<{ status: string; count: number; data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/markets/market-signal?timeframe=${encodeURIComponent(timeframe)}`,
    );
    if (!res.ok)
      throw new Error(`Failed to fetch market signals: ${res.status}`);
    return res.json();
  }

  async getMarketSignalBatchIds(): Promise<{
    status: string;
    count: number;
    data: string[];
  }> {
    const res = await fetch(`${BASE_URL}/markets/market-signal/batch/ids`);
    if (!res.ok)
      throw new Error(`Failed to fetch market signal batch ids: ${res.status}`);
    return res.json();
  }

  async getMarketSignalBatch(
    batchId: string,
  ): Promise<{ status: string; count: number; data: any[] }> {
    const res = await fetch(
      `${BASE_URL}/markets/market-signal/batch?batchId=${encodeURIComponent(batchId)}`,
    );
    if (!res.ok)
      throw new Error(`Failed to fetch market signal batch: ${res.status}`);
    return res.json();
  }
}

export const marketsService = MarketsService.getInstance();
