import { CtMarketSentimentType } from "../types/market-sentiment.enum";
import { BeMarketSentimentRes } from "../types/market-sentiment.interface";
import { environment } from "../../../environments/environment";
const BASE_URL = environment.ENDPOINTS.NODE.BASE_URL;

export class MarketSentimentService {
  private static instance: MarketSentimentService;
  static getInstance(): MarketSentimentService {
    if (!MarketSentimentService.instance)
      MarketSentimentService.instance = new MarketSentimentService();
    return MarketSentimentService.instance;
  }

  async getSentiment(
    type: CtMarketSentimentType,
  ): Promise<BeMarketSentimentRes> {
    const res = await fetch(
      `${BASE_URL}/markets/market-sentiment?type=${encodeURIComponent(type)}`,
    );
    if (!res.ok)
      throw new Error(`Failed to fetch market sentiment: ${res.status}`);
    return res.json();
  }
}

export const marketSentimentService = MarketSentimentService.getInstance();
