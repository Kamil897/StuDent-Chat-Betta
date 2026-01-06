import { addPoints } from "./points";
import { syncCurrentUserPoints } from "./leaderboard";
import { notifyGameWin } from "./notifications";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export async function handleGameWin(gameName: string): Promise<void> {
  // Award points based on game
  const pointsMap: Record<string, number> = {
    "Asteroids": 10,
    "Minesweeper": 15,
    "Ping Pong": 10,
    "Rock Paper Scissors": 5,
    "Snake": 8,
    "Tir": 10,
    "Arena Shooter": 15,
    "Teleporting Cube": 8,
  };

  const points = pointsMap[gameName] || 5;
  
  // Сохраняем локально
  const newBalance = addPoints(points, "game_win", gameName);
  
  // Отправляем на backend если пользователь авторизован
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/wallet/award-game-win`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          gameName,
          amount: points,
        }),
      });
    } catch (error) {
      console.error("Error sending game win to backend:", error);
    }
  }
  
  // Sync with leaderboard
  syncCurrentUserPoints();
  
  // Add notification
  notifyGameWin(gameName, points);
  
  // Dispatch custom event to notify other components
  const event = new CustomEvent("game-win", {
    detail: { gameName, points, newBalance },
  });
  window.dispatchEvent(event);
  
  // Also dispatch storage event for cross-tab synchronization
  window.dispatchEvent(new StorageEvent("storage", {
    key: "user_points",
    newValue: newBalance.toString(),
  }));
}

