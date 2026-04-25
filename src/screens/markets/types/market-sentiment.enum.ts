export enum CtMarketSentimentType {
  MonthlyCrossed30 = "MonthlyCrossed30",
  MonthlyCrossed40 = "MonthlyCrossed40",
}

export const MARKET_SENTIMENT_OPTIONS: {
  label: string;
  value: CtMarketSentimentType;
}[] = [
  {
    label: "Monthly Crossed 30",
    value: CtMarketSentimentType.MonthlyCrossed30,
  },
  {
    label: "Monthly Crossed 40",
    value: CtMarketSentimentType.MonthlyCrossed40,
  },
];
