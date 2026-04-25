import { CtMarketSentimentType } from "./market-sentiment.enum";

export interface CtMarketSentimentDataPoint {
  date: string;
  count: number;
}
export interface CtMarketSentimentResult {
  type: CtMarketSentimentType;
  data: CtMarketSentimentDataPoint[];
}
export interface BeMarketSentimentRes {
  status: string;
  message: string;
  data: CtMarketSentimentResult;
}
