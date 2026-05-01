import { environment } from "../../environments/environment";
import { authenticatedGet } from "../auth/auth.service";
import { INotificationHistoryResponse } from "../../types/interfaces";

export async function getNotificationHistory(
  page = 1,
  limit = 20,
): Promise<INotificationHistoryResponse> {
  return authenticatedGet<INotificationHistoryResponse>(
    `/notifications/history?page=${page}&limit=${limit}`,
  );
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
  console.log("[PushToken] Registering token:", token);
  const { getAccessToken, refreshTokens } =
    await import("../auth/auth.service");
  let accessToken = await getAccessToken();
  if (!accessToken) {
    console.warn("[PushToken] No access token — aborting registration");
    return;
  }
  let res = await doRegisterPushToken(token, accessToken);
  if (res.status === 401) {
    console.log("[PushToken] Token expired, refreshing...");
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await doRegisterPushToken(token, refreshed.accessToken);
    } else {
      console.warn("[PushToken] Refresh failed — token not registered");
      return;
    }
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[PushToken] Failed ${res.status}:`, body);
    return;
  }
  console.log("[PushToken] Successfully registered push token");
}
