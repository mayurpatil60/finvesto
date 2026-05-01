// ─── Push Notification Service ────────────────────────────────────────────────

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type {
  INotificationPayload,
  IPushNotificationService,
} from "../types/interfaces";

let handlerSet = false;

export function ensureNotificationHandler() {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

class PushNotificationService implements IPushNotificationService {
  private static instance: PushNotificationService;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async getExpoPushToken(): Promise<string | null> {
    console.log("[Step 1] getExpoPushToken called");

    if (!Device.isDevice) {
      console.warn(
        "[Step 1] FAIL: Not a physical device — push tokens not available on emulators/simulators",
      );
      return null;
    }
    console.log("[Step 1] PASS: Running on physical device");

    console.log("[Step 2] Checking notification permissions...");
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    console.log("[Step 2] Current permission status:", existingStatus);

    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      console.log("[Step 2] Requesting permission...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("[Step 2] Permission after request:", finalStatus);
    }

    if (finalStatus !== "granted") {
      console.warn(
        "[Step 2] FAIL: Notification permission denied. Status:",
        finalStatus,
      );
      return null;
    }
    console.log("[Step 2] PASS: Permission granted");

    console.log(
      "[Step 3] Calling getExpoPushTokenAsync with projectId: 778634ef-de86-45f4-8c7e-3102f66cd9f8",
    );
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "778634ef-de86-45f4-8c7e-3102f66cd9f8",
      });
      console.log("[Step 3] PASS: Token obtained:", tokenData.data);
      return tokenData.data;
    } catch (err: any) {
      console.error(
        "[Step 3] FAIL: getExpoPushTokenAsync threw:",
        err?.message ?? err,
      );
      return null;
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    console.log(
      "[Step 0] registerForPushNotifications called. Platform:",
      Platform.OS,
    );
    if (Platform.OS === "android") {
      console.log("[Step 0] Setting up Android notification channel...");
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1A73E8",
      });
      console.log("[Step 0] Android channel set up");
    }

    return this.getExpoPushToken();
  }

  async scheduleLocalNotification(
    payload: INotificationPayload,
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      },
      trigger: null, // immediate
    });
    return id;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void,
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void,
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
