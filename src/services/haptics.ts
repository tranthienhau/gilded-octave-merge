// Thin wrapper over Capacitor Haptics so the game can call buzz() freely; it
// no-ops on web/simulator where the plugin is unavailable.

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const Buzz = {
  async tap(style: ImpactStyle = ImpactStyle.Light) {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.impact({ style });
    } catch {
      /* ignore */
    }
  },
  async merge() {
    return this.tap(ImpactStyle.Medium);
  },
  async win() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      /* ignore */
    }
  },
  async lose() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      /* ignore */
    }
  },
};
