export type NotificationType = "game_win" | "achievement" | "purchase" | "message" | "friend_request" | "friend_accepted" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  read: boolean;
  createdAt: string;
  link?: string; // Optional link to navigate when clicked
  data?: any; // Additional data (game name, achievement id, etc.)
}

const STORAGE_KEY = "user_notifications";
const MAX_NOTIFICATIONS = 100; // Keep last 100 notifications

/**
 * Get all notifications
 */
export function getNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save notifications to storage
 */
function saveNotifications(notifications: Notification[]): void {
  try {
    // Keep only last MAX_NOTIFICATIONS
    const limited = notifications.slice(-MAX_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent("notifications-updated", { detail: { notifications: limited } }));
  } catch (error) {
    console.error("Error saving notifications:", error);
  }
}

/**
 * Add a new notification
 */
export function addNotification(notification: Omit<Notification, "id" | "read" | "createdAt">): void {
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  
  notifications.push(newNotification);
  saveNotifications(notifications);
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId: string): void {
  const notifications = getNotifications();
  const notification = notifications.find((n) => n.id === notificationId);
  if (notification) {
    notification.read = true;
    saveNotifications(notifications);
  }
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead(): void {
  const notifications = getNotifications();
  notifications.forEach((n) => (n.read = true));
  saveNotifications(notifications);
}

/**
 * Delete a notification
 */
export function deleteNotification(notificationId: string): void {
  const notifications = getNotifications();
  const filtered = notifications.filter((n) => n.id !== notificationId);
  saveNotifications(filtered);
}

/**
 * Delete all notifications
 */
export function deleteAllNotifications(): void {
  saveNotifications([]);
}

/**
 * Get unread count
 */
export function getUnreadCount(): number {
  const notifications = getNotifications();
  return notifications.filter((n) => !n.read).length;
}

/**
 * Helper: Add game win notification
 */
export function notifyGameWin(gameName: string, points: number): void {
  addNotification({
    type: "game_win",
    title: "🎮 Победа в игре!",
    message: `Вы выиграли в "${gameName}" и получили ${points} очков!`,
    icon: "🎮",
    link: "/Wallet",
  });
}

/**
 * Helper: Add achievement notification
 */
export function notifyAchievement(achievementName: string, description: string): void {
  addNotification({
    type: "achievement",
    title: "🏆 Новое достижение!",
    message: `${achievementName}: ${description}`,
    icon: "🏆",
    link: "/profile",
  });
}

/**
 * Helper: Add purchase notification
 */
export function notifyPurchase(productName: string, type: "game" | "subscription" | "other"): void {
  const icons = {
    game: "🎮",
    subscription: "⭐",
    other: "🛒",
  };
  
  addNotification({
    type: "purchase",
    title: "✅ Покупка успешна!",
    message: `Вы приобрели: ${productName}`,
    icon: icons[type] || "🛒",
    link: type === "game" ? "/games" : "/Magaz",
  });
}

/**
 * Helper: Add message notification
 */
export function notifyMessage(fromUsername: string, message: string, chatId?: string): void {
  addNotification({
    type: "message",
    title: `💬 Новое сообщение от ${fromUsername}`,
    message: message.length > 50 ? message.substring(0, 50) + "..." : message,
    icon: "💬",
    link: chatId ? `/chat/${chatId}` : "/chat",
  });
}

/**
 * Helper: Add friend request notification
 */
export function notifyFriendRequest(fromUsername: string): void {
  addNotification({
    type: "friend_request",
    title: "👤 Новый запрос в друзья",
    message: `${fromUsername} хочет добавить вас в друзья`,
    icon: "👤",
    link: "/profile",
  });
}

/**
 * Helper: Add friend accepted notification
 */
export function notifyFriendAccepted(username: string): void {
  addNotification({
    type: "friend_accepted",
    title: "✅ Запрос принят",
    message: `${username} принял ваш запрос в друзья`,
    icon: "✅",
    link: "/chat",
  });
}

/**
 * Helper: Add system notification
 */
export function notifySystem(title: string, message: string, icon?: string): void {
  addNotification({
    type: "system",
    title,
    message,
    icon: icon || "ℹ️",
  });
}

