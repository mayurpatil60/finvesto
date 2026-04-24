export enum CtSentimentType {
  Buy = "Buy",
  Sell = "Sell",
}

export const SENTIMENT_OPTIONS: { label: string; value: CtSentimentType }[] = [
  { label: "Buy", value: CtSentimentType.Buy },
  { label: "Sell", value: CtSentimentType.Sell },
];
