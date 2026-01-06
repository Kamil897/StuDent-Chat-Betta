import type { Request, Response, NextFunction } from "express";
import { PointsService } from "../services/PointsService.js";

const pointsService = new PointsService();

export class WalletController {
  async getWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as { id: string } | undefined;

      // Если пользователь не авторизован (frontend ещё не шлёт токен) —
      // возвращаем безопасные дефолты, чтобы не было 401 и не ломался UI.
      if (!user) {
        return res.json({
          balance: 0,
          stats: null,
        });
      }

      const wallet = await pointsService.getWallet(user.id);
      return res.json(wallet);
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as { id: string } | undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 50;

      if (!user) {
        return res.json({
          items: [],
          total: 0,
          page,
          pageSize,
        });
      }

      const result = await pointsService.getTransactions(
        user.id,
        page,
        pageSize,
      );
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async awardGameWin(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as { id: string } | undefined;
      if (!user) {
        const err: any = new Error("Unauthorized");
        err.statusCode = 401;
        throw err;
      }

      const { gameName, amount } = req.body as {
        gameName: string;
        amount?: number;
      };
      const balance = await pointsService.awardGameWin(
        user.id,
        gameName,
        amount ?? 15,
      );
      res.json({ balance });
    } catch (err) {
      next(err);
    }
  }
}

export const walletController = new WalletController();


