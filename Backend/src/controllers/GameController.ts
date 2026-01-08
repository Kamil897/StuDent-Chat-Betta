import type { Request, Response, NextFunction } from "express";
import { GameService } from "../services/GameService.js";

const gameService = new GameService();

export class GameController {
  async listGames(_req: Request, res: Response, next: NextFunction) {
    try {
      const games = await gameService.listGames();
      res.json({ games });
    } catch (err) {
      next(err);
    }
  }

  async listUnlocked(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const unlocked = await gameService.listUnlockedGames(userId);
      res.json({ unlocked });
    } catch (err) {
      next(err);
    }
  }

  async unlock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const { gameId } = req.params;
      const unlock = await gameService.unlockGame(userId, gameId);
      res.status(201).json({ unlock });
    } catch (err) {
      next(err);
    }
  }
}

export const gameController = new GameController();




