// ─── useAppUpdater ────────────────────────────────────────────────────────────
// Checks for an OTA update on mount. If one is available, downloads and
// reloads the app automatically — users always get the latest JS bundle.

import { useEffect } from "react";
import * as Updates from "expo-updates";

export function useAppUpdater() {
  useEffect(() => {
    async function checkForUpdate() {
      // OTA updates only work in production / preview builds (not Expo Go dev)
      if (__DEV__) return;

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync(); // restart with new bundle
        }
      } catch {
        // Silently ignore — network issues or update server unavailable
      }
    }

    checkForUpdate();
  }, []);
}
