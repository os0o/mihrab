// إشعارات النظام. أندرويد كروم يرفض new Notification() ويشترط إظهارها عبر Service Worker
export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotifications() {
  if (!notificationsSupported()) return "unsupported" as const;
  return Notification.requestPermission();
}

export async function showNotification(title: string, body: string, tag: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const options: NotificationOptions = {
    body,
    tag,
    icon: `${BASE}/icons/icon-192.png`,
    badge: `${BASE}/icons/icon-192.png`,
    lang: "ar",
    dir: "rtl",
  };
  try {
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
    new Notification(title, options);
  } catch {
    // تجاهل: التنبيه داخل التطبيق يبقى ظاهرًا
  }
}
