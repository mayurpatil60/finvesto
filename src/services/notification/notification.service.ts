import { environment } from "../../environments/environment";
import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPatch,
  authenticatedPost,
} from "../auth/auth.service";
import { INotificationHistoryResponse } from "../../types/interfaces";

export async function getNotificationHistory(
  page = 1,
  limit = 20,
): Promise<INotificationHistoryResponse> {
  return authenticatedGet<INotificationHistoryResponse>(
    `/notifications/history?page=${page}&limit=${limit}`,
  );
}

export async function getUnreadCount(): Promise<number> {
  const res = await authenticatedGet<{ count: number }>(
    "/notifications/unread-count",
  );
  return res.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await authenticatedPatch(`/notifications/read/${id}`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await authenticatedPost("/notifications/read-all");
}

export async function deleteNotification(id: string): Promise<void> {
  await authenticatedDelete(`/notifications/${id}`);
}

export async function clearAllNotifications(): Promise<void> {
  await authenticatedDelete("/notifications/clear");
}

async function doRegisterPushToken(
  token: string,
  accessToken: string,
): Promise<Response> {
  return fetch(`${environment.API_BASE}/users/push-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token }),
  });
}

export async function registerPushToken(token: string): Promise<void> {
  console.log("[Step 4] registerPushToken called with:", token);
  const { getAccessToken, refreshTokens } =
    await import("../auth/auth.service");
  let accessToken = await getAccessToken();
  console.log("[Step 4] Access token present:", !!accessToken);
  if (!accessToken) {
    console.warn(
      "[Step 4] FAIL: No access token — user not logged in, aborting registration",
    );
    return;
  }
  console.log("[Step 4] Calling POST /users/push-token ...");
  let res = await doRegisterPushToken(token, accessToken);
  console.log("[Step 4] Response status:", res.status);
  if (res.status === 401) {
    console.log("[Step 4] 401 — refreshing tokens...");
    const refreshed = await refreshTokens();
    if (refreshed) {
      console.log("[Step 4] Token refreshed, retrying registration...");
      res = await doRegisterPushToken(token, refreshed.accessToken);
      console.log("[Step 4] Retry response status:", res.status);
    } else {
      console.warn(
        "[Step 4] FAIL: Token refresh failed — push token not registered",
      );
      return;
    }
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[Step 4] FAIL: Server returned ${res.status}:`, body);
    return;
  }
  console.log(
    "[Step 4] PASS: Push token successfully registered in backend DB",
  );
}
