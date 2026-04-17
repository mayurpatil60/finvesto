// ─── Utility Helpers ─────────────────────────────────────────────────────────

export const formatName = (name: string): string =>
  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

export const formatCurrency = (amount: number, currency = "INR"): string =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
    amount,
  );

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
