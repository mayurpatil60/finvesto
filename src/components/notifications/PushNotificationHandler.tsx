// ─── Push Notification Handler Component ──────────────────────────────────────
//
// Mount this component once at the root of your app (e.g. App.tsx).
// It registers the device for push notifications, listens for incoming
// notifications and user responses, and exposes a hook for child components.

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { pushNotificationService } from "../../services/PushNotificationService";
import { ensureNotificationHandler } from "../../services/PushNotificationService";
import { useAuth } from "../auth/AuthProvider";
import { registerPushToken } from "../../services/notification/notification.service";
import type { INotificationPayload } from "../../types/interfaces";

// Set handler exactly once when the module loads
ensureNotificationHandler();

// ─── Context ─────────────────────────────────────────────────────────────────

interface IPushNotificationContext {
  expoPushToken: string | null;
  lastNotification: Notifications.Notification | null;
  lastResponse: Notifications.NotificationResponse | null;
  sendLocalNotification: (payload: INotificationPayload) => Promise<string>;
  cancelNotification: (id: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const PushNotificationContext = createContext<IPushNotificationContext | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

interface PushNotificationHandlerProps {
  children: React.ReactNode;
  onTokenReceived?: (token: string) => void;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

export function PushNotificationHandler({
  children,
  onTokenReceived,
  onNotificationReceived,
  onNotificationResponse,
}: PushNotificationHandlerProps) {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] =
    useState<Notifications.Notification | null>(null);
  const [lastResponse, setLastResponse] =
    useState<Notifications.NotificationResponse | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const registered = useRef(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (registered.current) return; // prevent double-registration on re-render
    registered.current = true;

    pushNotificationService.registerForPushNotifications().then((token) => {
      if (token) {
        console.log("[PushToken] Expo push token obtained:", token);
        tokenRef.current = token;
        setExpoPushToken(token);
        onTokenReceived?.(token);
      } else {
        console.warn("[PushToken] No token returned — check device/permissions");
      }
    }).catch((err) => {
      console.error("[PushToken] Error getting push token:", err);
    });

    notificationListener.current =
      pushNotificationService.addNotificationReceivedListener((notification) => {
        setLastNotification(notification);
        onNotificationReceived?.(notification);
      });

    responseListener.current =
      pushNotificationService.addNotificationResponseReceivedListener((response) => {
        setLastResponse(response);
        onNotificationResponse?.(response);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Register the push token with the backend whenever user logs in OR token arrives — whichever is last
  useEffect(() => {
    console.log("[Step 4 trigger] user:", !!user, "expoPushToken:", !!expoPushToken);
    if (user && expoPushToken) {
      registerPushToken(expoPushToken).catch((err) => {
        console.error("[Step 4 trigger] registerPushToken threw:", err);
      });
    }
  }, [user, expoPushToken]);

  const value: IPushNotificationContext = {
    expoPushToken,
    lastNotification,
    lastResponse,
    sendLocalNotification: (payload) =>
      pushNotificationService.scheduleLocalNotification(payload),
    cancelNotification: (id) =>
      pushNotificationService.cancelNotification(id),
    cancelAllNotifications: () =>
      pushNotificationService.cancelAllNotifications(),
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePushNotification(): IPushNotificationContext {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error(
      "usePushNotification must be used within a PushNotificationHandler"
    );
  }
  return context;
}
