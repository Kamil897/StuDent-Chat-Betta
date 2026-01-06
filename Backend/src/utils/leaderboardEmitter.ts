import { EventEmitter } from "events";

// Глобальный эмиттер для обновлений лидерборда
export const leaderboardEmitter = new EventEmitter();

// Функция для уведомления об обновлении лидерборда
export function notifyLeaderboardUpdate() {
  leaderboardEmitter.emit("leaderboard_updated");
}

