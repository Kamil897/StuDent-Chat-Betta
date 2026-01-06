import type { Request, Response, NextFunction } from "express";
import { SubscriptionRepository } from "../repositories/SubscriptionRepository.js";

const subscriptionRepository = new SubscriptionRepository();

export class SubscriptionController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const items = await subscriptionRepository.listUserSubscriptions(userId);
      res.json({ items });
    } catch (err) {
      next(err);
    }
  }

  // mock-активация подписки (пока без реального платежного шлюза)
  async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id as string;
      const { type, durationDays } = req.body as {
        type: string;
        durationDays?: number;
      };

      if (!type) {
        res.status(400).json({
          error: { code: "INVALID_TYPE", message: "type is required" },
        });
        return;
      }

      const sub = await subscriptionRepository.activateSubscription(
        userId,
        type,
        durationDays ?? 30,
      );
      res.status(201).json({ subscription: sub });
    } catch (err) {
      next(err);
    }
  }
}

export const subscriptionController = new SubscriptionController();



