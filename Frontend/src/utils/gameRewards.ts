import { addPoints } from "./points";

export function handleGameWin(gameName: string): void {
  // Award points based on game
  const pointsMap: Record<string, number> = {
    "Asteroids": 10,
    "Minesweeper": 15,
    "Ping Pong": 10,
    "TicTacToe": 5,
  };

  const points = pointsMap[gameName] || 5;
  addPoints(points, "game_win", gameName);
}

