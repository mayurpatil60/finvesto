// ─── Device Token Service ─────────────────────────────────────────────────────
// Registers the Expo push token with the backend.
// Completely standalone — remove this file and its call site to disable.

import { Platform } from "react-native";

const BASE_URL = "https://finvesto-backend-y9ly.onrender.com";

class DeviceTokenService {
  private static instance: DeviceTokenService;

  static getInstance(): DeviceTokenService {
    if (!DeviceTokenService.instance) {
      DeviceTokenService.instance = new DeviceTokenService();
    }
    return DeviceTokenService.instance;
  }

  async register(token: string): Promise<void> {
    try {
      const platform = Platform.OS; // "ios" | "android" | "web"
      const res = await fetch(`${BASE_URL}/api/push-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform }),
      });

      if (!res.ok) {
        console.warn(
          `DeviceTokenService: failed to register token (${res.status})`,
        );
      } else {
        console.info("DeviceTokenService: token registered successfully");
      }
    } catch (err) {
      // Non-critical — app still works if this fails
      console.warn("DeviceTokenService: error registering token:", err);
    }
  }
}

export const deviceTokenService = DeviceTokenService.getInstance();
