import { addPoints } from "./points";
import { syncCurrentUserPoints } from "./leaderboard";

export function handleGameWin(gameName: string): void {
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
  const newBalance = addPoints(points, "game_win", gameName);
  
  // Sync with leaderboard
  syncCurrentUserPoints();
  
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

