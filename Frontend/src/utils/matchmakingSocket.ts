import { io, Socket } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let matchmakingSocket: Socket | null = null;

/**
 * Подключиться к WebSocket серверу для matchmaking
 */
export function connectMatchmakingSocket(): Socket | null {
  if (matchmakingSocket?.connected) {
    return matchmakingSocket;
  }

  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  
  if (!token) {
    console.error("[MatchmakingSocket] No auth token");
    return null;
  }

  matchmakingSocket = io(`${API_BASE_URL}/matchmaking`, {
    auth: {
      token: token,
    },
    transports: ["websocket", "polling"],
  });

  matchmakingSocket.on("connect", () => {
    console.log("[MatchmakingSocket] Connected to server");
  });

  matchmakingSocket.on("disconnect", () => {
    console.log("[MatchmakingSocket] Disconnected from server");
  });

  matchmakingSocket.on("error", (error) => {
    console.error("[MatchmakingSocket] Error:", error);
  });

  return matchmakingSocket;
}

/**
 * Отключиться от WebSocket сервера
 */
export function disconnectMatchmakingSocket() {
  if (matchmakingSocket) {
    matchmakingSocket.disconnect();
    matchmakingSocket = null;
  }
}

/**
 * Найти матч
 */
export function findMatch(gameId: string, callbacks: {
  onSearching?: () => void;
  onMatchFound?: (data: { matchId: string; opponentId: string; gameId: string }) => void;
  onError?: (error: string) => void;
}) {
  if (!matchmakingSocket) {
    connectMatchmakingSocket();
  }

  if (!matchmakingSocket) {
    callbacks.onError?.("Failed to connect to matchmaking server");
    return;
  }

  // Удаляем старые обработчики
  matchmakingSocket.off("searching");
  matchmakingSocket.off("match_found");
  matchmakingSocket.off("error");

  // Устанавливаем новые обработчики
  matchmakingSocket.on("searching", () => {
    callbacks.onSearching?.();
  });

  matchmakingSocket.on("match_found", (data) => {
    callbacks.onMatchFound?.(data);
  });

  matchmakingSocket.on("error", (error: any) => {
    callbacks.onError?.(error.message || "Matchmaking error");
  });

  // Отправляем запрос на поиск
  matchmakingSocket.emit("find_match", { gameId });
}

/**
 * Отменить поиск матча
 */
export function cancelMatchSearch(callback?: () => void) {
  if (!matchmakingSocket) {
    return;
  }

  matchmakingSocket.once("search_cancelled", () => {
    callback?.();
  });

  matchmakingSocket.emit("cancel_search");
}

/**
 * Получить текущее подключение
 */
export function getMatchmakingSocket(): Socket | null {
  return matchmakingSocket;
}


