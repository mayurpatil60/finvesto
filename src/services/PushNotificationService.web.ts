// ─── Push Notification Service — Web Shim ────────────────────────────────────
// expo-notifications is not supported on web.
// This no-op shim is loaded automatically by Metro on web builds.

import type { INotificationPayload } from "../types/interfaces";

type EventSubscription = { remove: () => void };

class PushNotificationServiceWeb {
  private static instance: PushNotificationServiceWeb;

  private constructor() {}

  static getInstance(): PushNotificationServiceWeb {
    if (!PushNotificationServiceWeb.instance) {
      PushNotificationServiceWeb.instance = new PushNotificationServiceWeb();
    }
    return PushNotificationServiceWeb.instance;
  }

  async getExpoPushToken(): Promise<string | null> {
    return null;
  }

  async registerForPushNotifications(): Promise<string | null> {
    return null;
  }

  async scheduleLocalNotification(
    _payload: INotificationPayload,
  ): Promise<string> {
    console.warn("Push notifications are not supported on web.");
    return "";
  }

  async cancelNotification(_notificationId: string): Promise<void> {}

  async cancelAllNotifications(): Promise<void> {}

  addNotificationReceivedListener(
    _callback: (notification: unknown) => void,
  ): EventSubscription {
    return { remove: () => {} };
  }

  addNotificationResponseReceivedListener(
    _callback: (response: unknown) => void,
  ): EventSubscription {
    return { remove: () => {} };
  }
}

export const pushNotificationService = PushNotificationServiceWeb.getInstance();

// No-op shim — web has no expo-notifications handler to set
export function ensureNotificationHandler(): void {}
