import { io, Socket } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let leaderboardSocket: Socket | null = null;

/**
 * Подключиться к WebSocket серверу для лидерборда
 */
export function connectLeaderboardSocket(): Socket | null {
  if (leaderboardSocket?.connected) {
    return leaderboardSocket;
  }

  leaderboardSocket = io(`${API_BASE_URL}/leaderboard`, {
    transports: ["websocket", "polling"],
  });

  leaderboardSocket.on("connect", () => {
    console.log("[LeaderboardSocket] Connected to server");
    leaderboardSocket?.emit("subscribe");
  });

  leaderboardSocket.on("disconnect", () => {
    console.log("[LeaderboardSocket] Disconnected from server");
  });

  leaderboardSocket.on("error", (error) => {
    console.error("[LeaderboardSocket] Error:", error);
  });

  return leaderboardSocket;
}

/**
 * Отключиться от WebSocket сервера
 */
export function disconnectLeaderboardSocket() {
  if (leaderboardSocket) {
    leaderboardSocket.disconnect();
    leaderboardSocket = null;
  }
}

/**
 * Подписаться на обновления лидерборда
 */
export function onLeaderboardUpdate(callback: (leaderboard: any[]) => void) {
  if (!leaderboardSocket) {
    connectLeaderboardSocket();
  }
  if (leaderboardSocket) {
    leaderboardSocket.on("leaderboard_update", (data: { leaderboard: any[] }) => {
      callback(data.leaderboard);
    });
  }
}

/**
 * Отписаться от обновлений лидерборда
 */
export function offLeaderboardUpdate(callback: (leaderboard: any[]) => void) {
  if (leaderboardSocket) {
    leaderboardSocket.off("leaderboard_update", callback);
  }
}

/**
 * Получить текущее подключение
 */
export function getLeaderboardSocket(): Socket | null {
  return leaderboardSocket;
}


