import { addPoints } from "./points";
import { syncCurrentUserPoints } from "./leaderboard";
import { notifyGameWin } from "./notifications";
import { submitGameRecord, getGameName } from "./gameRecords";
import { checkGameAchievements } from "./achievements";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export async function handleGameWin(gameName: string, score?: number): Promise<void> {
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
    "Chess": 20,
    "Checkers": 15,
  };

  const points = pointsMap[gameName] || 5;
  
  // Сохраняем локально
  const newBalance = addPoints(points, "game_win", gameName);
  
  // Map game name to game ID
  const gameIdMap: Record<string, string> = {
    "Asteroids": "Asteroid",
    "Minesweeper": "MineSweeper",
    "Ping Pong": "Pingpong",
    "Rock Paper Scissors": "Don",
    "Snake": "Snake",
    "Tir": "Tir",
    "Arena Shooter": "ArenaShooter",
    "Teleporting Cube": "TeleportingCubeGame",
    "Chess": "Chess",
    "Checkers": "Checkers",
  };
  
  const gameId = gameIdMap[gameName] || gameName;
  
  // Submit game record if score is provided
  if (score !== undefined) {
    submitGameRecord(gameId, gameName, 'score', score);
  } else {
    // Submit win record
    const transactions = JSON.parse(localStorage.getItem("user_transactions") || "[]");
    const gameWins = transactions.filter((t: any) => 
      t.type === "game_win" && t.source.toLowerCase().includes(gameName.toLowerCase())
    ).length;
    submitGameRecord(gameId, gameName, 'wins', gameWins + 1);
  }
  
  // Check achievements
  const transactions = JSON.parse(localStorage.getItem("user_transactions") || "[]");
  const totalWins = transactions.filter((t: any) => t.type === "game_win").length;
  checkGameAchievements(gameName, totalWins + 1);
  
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
  
  // Dispatch game record update event
  window.dispatchEvent(new CustomEvent("game-record-updated", {
    detail: { gameId, gameName },
  }));
  
  // Also dispatch storage event for cross-tab synchronization
  window.dispatchEvent(new StorageEvent("storage", {
    key: "user_points",
    newValue: newBalance.toString(),
  }));
}

