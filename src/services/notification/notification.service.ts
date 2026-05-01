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

export async function registerPushToken(token: string): Promise<void> {
  const { getAccessToken, refreshTokens } =
    await import("../auth/auth.service");
  let accessToken = await getAccessToken();
  const res = await fetch(`${environment.API_BASE}/users/push-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token }),
  });
  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      await fetch(`${environment.API_BASE}/users/push-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshed.accessToken}`,
        },
        body: JSON.stringify({ token }),
      });
    }
  }
}
