export type NotificationKind =
  | "task"
  | "schedule"
  | "availability"
  | "warning";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
  dedupeKey?: string;
}

interface CreateNotificationInput {
  title: string;
  message: string;
  kind: NotificationKind;
  dedupeKey?: string;
}

const notificationsStorageKey = "appNotifications";
export const notificationsUpdatedEvent = "app-notifications-updated";
const maxNotifications = 25;

function canUseStorage() {
  return typeof window !== "undefined";
}

function emitNotificationsUpdated() {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(notificationsUpdatedEvent));
}

export function getNotifications(): AppNotification[] {
  if (!canUseStorage()) {
    return [];
  }

  const stored = window.localStorage.getItem(notificationsStorageKey);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistNotifications(notifications: AppNotification[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    notificationsStorageKey,
    JSON.stringify(notifications.slice(0, maxNotifications))
  );
  emitNotificationsUpdated();
}

export function addNotification(input: CreateNotificationInput) {
  const notifications = getNotifications();

  if (
    input.dedupeKey &&
    notifications.some((notification) => notification.dedupeKey === input.dedupeKey)
  ) {
    return;
  }

  const nextNotifications: AppNotification[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title,
      message: input.message,
      kind: input.kind,
      createdAt: new Date().toISOString(),
      read: false,
      dedupeKey: input.dedupeKey,
    },
    ...notifications,
  ];

  persistNotifications(nextNotifications);
}

export function markNotificationRead(notificationId: string) {
  const notifications = getNotifications().map((notification) =>
    notification.id === notificationId
      ? { ...notification, read: true }
      : notification
  );

  persistNotifications(notifications);
}

export function markAllNotificationsRead() {
  const notifications = getNotifications().map((notification) => ({
    ...notification,
    read: true,
  }));

  persistNotifications(notifications);
}

