import { CtSentimentType } from "./option-sentiment.enum";

export interface CtSentimentDataPoint {
  date: string; // ISO format: "2026-04-24"
  count: number;
}

export interface CtSentimentResult {
  type: CtSentimentType;
  data: CtSentimentDataPoint[];
}

export interface BeSentimentRes {
  status: string;
  message: string;
  data: CtSentimentResult;
}
