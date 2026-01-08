import type { Request, Response, NextFunction } from "express";
import { MatchmakingService } from "../services/MatchmakingService.js";

const matchmakingService = new MatchmakingService();

export class MatchmakingController {
  async queue(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const { gameId } = req.body as { gameId: string };

      if (!gameId) {
        res.status(400).json({
          error: { code: "INVALID_GAME_ID", message: "gameId is required" },
        });
        return;
      }

      const result = await matchmakingService.queue(userId, gameId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      await matchmakingService.cancel(userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async status(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const result = await matchmakingService.status(userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const matchmakingController = new MatchmakingController();




