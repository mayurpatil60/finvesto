import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { environment } from "../../environments/environment";
import { IAuthTokens, IUser } from "../../types/interfaces";

const ACCESS_TOKEN_KEY = "finvesto_access_token";
const REFRESH_TOKEN_KEY = "finvesto_refresh_token";
const USER_KEY = "finvesto_user";

// SecureStore is not available on web — fall back to localStorage
async function storeItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

async function post<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data as T;
}

export async function login(
  body: LoginRequest,
): Promise<{ user: IUser; tokens: IAuthTokens }> {
  const res = await post<{ user: IUser; tokens: IAuthTokens }>(
    `${environment.API_BASE}/auth/login`,
    body,
  );
  await storeItem(ACCESS_TOKEN_KEY, res.tokens.accessToken);
  await storeItem(REFRESH_TOKEN_KEY, res.tokens.refreshToken);
  await storeItem(USER_KEY, JSON.stringify(res.user));
  return res;
}

export async function register(
  body: RegisterRequest,
): Promise<{ message: string; user: IUser }> {
  return post(`${environment.API_BASE}/auth/register`, body);
}

export async function refreshTokens(): Promise<IAuthTokens | null> {
  const refreshToken = await getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  try {
    const res = await post<IAuthTokens>(
      `${environment.API_BASE}/auth/refresh`,
      {
        refreshToken,
      },
    );
    await storeItem(ACCESS_TOKEN_KEY, res.accessToken);
    await storeItem(REFRESH_TOKEN_KEY, res.refreshToken);
    return res;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = await getItem(REFRESH_TOKEN_KEY);
  if (refreshToken) {
    try {
      await post(`${environment.API_BASE}/auth/logout`, { refreshToken });
    } catch {
      /* ignore logout errors */
    }
  }
  await deleteItem(ACCESS_TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
  await deleteItem(USER_KEY);
}

export async function getStoredUser(): Promise<IUser | null> {
  const raw = await getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function authenticatedGet<T>(path: string): Promise<T> {
  let token = await getAccessToken();
  const res = await fetch(`${environment.API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (!refreshed) throw new Error("Session expired");
    const retryRes = await fetch(`${environment.API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${refreshed.accessToken}` },
    });
    const data = await retryRes.json();
    if (!retryRes.ok) throw new Error(data.message);
    return data as T;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data as T;
}

async function authenticatedRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  let token = await getAccessToken();
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const makeRequest = (t: string) =>
    fetch(`${environment.API_BASE}${path}`, {
      method,
      headers: { ...headers, Authorization: `Bearer ${t}` },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await makeRequest(token ?? "");
  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (!refreshed) throw new Error("Session expired");
    res = await makeRequest(refreshed.accessToken);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data as T;
}

export async function authenticatedPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return authenticatedRequest<T>("POST", path, body);
}

export async function authenticatedPatch<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return authenticatedRequest<T>("PATCH", path, body);
}

export async function authenticatedDelete<T>(path: string): Promise<T> {
  return authenticatedRequest<T>("DELETE", path);
}
