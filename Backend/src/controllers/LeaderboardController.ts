import type { Request, Response, NextFunction } from "express";
import { LeaderboardRepository } from "../repositories/LeaderboardRepository.js";

const leaderboardRepository = new LeaderboardRepository();

export class LeaderboardController {
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 50;
      const offset = (page - 1) * pageSize;

      const items = await leaderboardRepository.getTop(pageSize, offset);

      res.json({
        items: items.map((entry) => ({
          id: entry.id,
          userId: entry.userId,
          points: entry.points,
          user: entry.user,
        })),
        page,
        pageSize,
        total: items.length,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const leaderboardController = new LeaderboardController();



