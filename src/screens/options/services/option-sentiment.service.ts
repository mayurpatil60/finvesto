import { CtSentimentType } from "../types/option-sentiment.enum";
import { BeSentimentRes } from "../types/option-sentiment.interface";

import { environment } from "../../../environments/environment";
const BASE_URL = environment.ENDPOINTS.NODE.BASE_URL;

export class OptionSentimentService {
  private static instance: OptionSentimentService;

  static getInstance(): OptionSentimentService {
    if (!OptionSentimentService.instance)
      OptionSentimentService.instance = new OptionSentimentService();
    return OptionSentimentService.instance;
  }

  /** GET /options/option-sentiment?type=Buy|Sell */
  async getSentiment(type: CtSentimentType): Promise<BeSentimentRes> {
    const res = await fetch(
      `${BASE_URL}/options/option-sentiment?type=${encodeURIComponent(type)}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch sentiment: ${res.status}`);
    return res.json();
  }
}

export const optionSentimentService = OptionSentimentService.getInstance();
