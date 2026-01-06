import type { Request, Response, NextFunction } from "express";
import { AchievementService } from "../services/AchievementService.js";

const achievementService = new AchievementService();

export class AchievementController {
  async listAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await achievementService.getAllAchievements();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  }

  async listUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const items = await achievementService.getUserAchievements(userId);
      res.json({ items });
    } catch (err) {
      next(err);
    }
  }

  async unlock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const { achievementId } = req.body as { achievementId: string };
      const ua = await achievementService.unlockAchievement(
        userId,
        achievementId,
      );
      res.status(201).json({ unlocked: ua });
    } catch (err) {
      next(err);
    }
  }
}

export const achievementController = new AchievementController();



