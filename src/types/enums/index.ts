// ─── Enums ────────────────────────────────────────────────────────────────────

export enum NotificationType {
  GENERAL = "GENERAL",
  ALERT = "ALERT",
  PROMOTION = "PROMOTION",
  SYSTEM = "SYSTEM",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  DELIVERED = "DELIVERED",
  READ = "READ",
  DISMISSED = "DISMISSED",
}

export enum AuthStatus {
  AUTHENTICATED = "AUTHENTICATED",
  UNAUTHENTICATED = "UNAUTHENTICATED",
  LOADING = "LOADING",
}

export enum ApiStatus {
  IDLE = "IDLE",
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export enum TabRoute {
  ANALYSIS = "Analysis",
  MARKETS = "Markets",
  HOME = "Home",
  TOOLS = "Tools",
  SETTINGS = "Settings",
}
