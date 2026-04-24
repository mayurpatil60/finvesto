// ─── Notification Log Service ─────────────────────────────────────────────────
// Fetches push notification history from the backend for the Notifications screen.
// Standalone — remove this file and the screen to disable.

const BASE_URL = "https://finvesto-backend-y9ly.onrender.com";

export interface NotificationLog {
  _id: string;
  title: string;
  body: string;
  batchId: string;
  buyCount: number;
  recipientCount: number;
  status: "sent" | "failed" | "no_tokens" | "no_buys";
  sentAt: string;
  error?: string;
}

class NotificationLogService {
  private static instance: NotificationLogService;

  static getInstance(): NotificationLogService {
    if (!NotificationLogService.instance) {
      NotificationLogService.instance = new NotificationLogService();
    }
    return NotificationLogService.instance;
  }

  async getLogs(limit: number = 50): Promise<NotificationLog[]> {
    const res = await fetch(`${BASE_URL}/api/notifications?limit=${limit}`);
    if (!res.ok)
      throw new Error(`Failed to fetch notifications: ${res.status}`);
    const json = await res.json();
    return json.data as NotificationLog[];
  }
}

export const notificationLogService = NotificationLogService.getInstance();
