import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export type ReminderPermission = "unknown" | "granted" | "denied" | "unsupported";

const maxTimeout = 2_147_000_000;
const browserTimers = new Map<number, number>();

export async function getReminderPermission(): Promise<ReminderPermission> {
  if (Capacitor.isNativePlatform()) {
    const status = await LocalNotifications.checkPermissions();
    return status.display === "granted" ? "granted" : "denied";
  }
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  return Notification.permission === "denied" ? "denied" : "unknown";
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (Capacitor.isNativePlatform()) {
    const status = await LocalNotifications.requestPermissions();
    return status.display === "granted" ? "granted" : "denied";
  }
  if (!("Notification" in window)) return "unsupported";
  const permission = await Notification.requestPermission();
  return permission === "granted"
    ? "granted"
    : permission === "denied"
      ? "denied"
      : "unknown";
}

export async function scheduleReminderNotification(
  id: number,
  reminderAt: string,
): Promise<void> {
  const timestamp = Date.parse(reminderAt);
  if (!Number.isFinite(timestamp)) return;
  await cancelReminderNotification(id);

  if (Capacitor.isNativePlatform()) {
    if (timestamp <= Date.now() || (await getReminderPermission()) !== "granted") {
      return;
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: "Waktunya membaca",
          body: "Buka Manuknest untuk melihat link pengingatmu.",
          schedule: { at: new Date(timestamp) },
        },
      ],
    });
    return;
  }

  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const notificationKey = `tumpuk.reminder-notified.${id}.${timestamp}`;
  if (window.localStorage.getItem(notificationKey)) return;

  function notifyWhenDue() {
    const remaining = timestamp - Date.now();
    if (remaining > 0) {
      browserTimers.set(
        id,
        window.setTimeout(notifyWhenDue, Math.min(remaining, maxTimeout)),
      );
      return;
    }
    browserTimers.delete(id);
    if (window.localStorage.getItem(notificationKey)) return;
    const notification = new Notification("Waktunya membaca", {
      body: "Buka Manuknest untuk melihat link pengingatmu.",
    });
    notification.onclick = () => window.focus();
    window.localStorage.setItem(notificationKey, "1");
  }

  notifyWhenDue();
}

export async function cancelReminderNotification(id: number): Promise<void> {
  const timer = browserTimers.get(id);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    browserTimers.delete(id);
  }
  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }
}

export async function cancelAllReminderNotifications(): Promise<void> {
  for (const timer of browserTimers.values()) {
    window.clearTimeout(timer);
  }
  browserTimers.clear();
  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.cancelAll();
  }
}
