// ─── Settings Service ─────────────────────────────────────────────────────────

import { environment } from "../../../environments/environment";
const BASE_URL = environment.ENDPOINTS.NODE.BASE_URL;

export class SettingsService {
  private static instance: SettingsService;
  static getInstance() {
    if (!SettingsService.instance)
      SettingsService.instance = new SettingsService();
    return SettingsService.instance;
  }

  async getExpiry(): Promise<{ expiryDate: string | null }> {
    const res = await fetch(`${BASE_URL}/api/config/expiry`);
    if (!res.ok) throw new Error(`Failed to fetch expiry: ${res.status}`);
    return res.json();
  }

  async saveExpiry(
    expiryDate: string,
  ): Promise<{ message: string; expiryDate: string }> {
    const res = await fetch(`${BASE_URL}/api/config/expiry/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiryDate }),
    });
    if (!res.ok) throw new Error(`Failed to save expiry: ${res.status}`);
    return res.json();
  }
}

export const settingsService = SettingsService.getInstance();
