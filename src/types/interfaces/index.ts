// ─── Interfaces ───────────────────────────────────────────────────────────────

import type { NotificationStatus, NotificationType } from "../enums";
import type { CtUserRole, CtUserStatus } from "../enums/auth.enum";

export interface IUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: CtUserRole;
  status: CtUserStatus;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAppState {
  user: IUser | null;
  isLoading: boolean;
}

export interface INotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  type?: NotificationType;
}

export interface INotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  receivedAt: string;
  data?: Record<string, unknown>;
}

export interface IPushNotificationService {
  registerForPushNotifications(): Promise<string | null>;
  scheduleLocalNotification(payload: INotificationPayload): Promise<string>;
  cancelNotification(notificationId: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  getExpoPushToken(): Promise<string | null>;
}

export interface IRemoteNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  channel: string;
  status: string;
  sentAt: string;
  data?: Record<string, unknown>;
}

export interface INotificationHistoryResponse {
  notifications: IRemoteNotification[];
  total: number;
}
