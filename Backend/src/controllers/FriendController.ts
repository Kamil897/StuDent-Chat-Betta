import type { Request, Response, NextFunction } from "express";
import { FriendService } from "../services/FriendService.js";

export class FriendController {
  private friendService: FriendService;

  constructor() {
    this.friendService = new FriendService();
  }

  /**
   * POST /api/friends/request
   * Отправить заявку в друзья по нику/имени
   */
  async sendFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).user?.sub;
      if (!userId) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
        return;
      }

      const { username } = req.body;
      if (!username) {
        res.status(400).json({ error: { code: "INVALID_USERNAME", message: "username is required" } });
        return;
      }

      const request = await this.friendService.sendFriendRequest(userId, username);
      res.status(201).json({ request });
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(404).json({ error: { code: "USER_NOT_FOUND", message: error.message } });
      } else if (error.message === "Friend request already exists" || error.message === "Users are already friends") {
        res.status(400).json({ error: { code: "ALREADY_EXISTS", message: error.message } });
      } else {
        next(error);
      }
    }
  }

  /**
   * POST /api/friends/accept/:requestId
   * Принять заявку в друзья
   */
  async acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).user?.sub;
      if (!userId) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
        return;
      }

      const { requestId } = req.params;
      const result = await this.friendService.acceptFriendRequest(requestId, userId);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Friend request not found") {
        res.status(404).json({ error: { code: "REQUEST_NOT_FOUND", message: error.message } });
      } else if (error.message === "Unauthorized" || error.message === "Friend request already processed") {
        res.status(400).json({ error: { code: "INVALID_REQUEST", message: error.message } });
      } else {
        next(error);
      }
    }
  }

  /**
   * POST /api/friends/reject/:requestId
   * Отклонить заявку в друзья
   */
  async rejectFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).user?.sub;
      if (!userId) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
        return;
      }

      const { requestId } = req.params;
      await this.friendService.rejectFriendRequest(requestId, userId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === "Friend request not found") {
        res.status(404).json({ error: { code: "REQUEST_NOT_FOUND", message: error.message } });
      } else if (error.message === "Unauthorized") {
        res.status(403).json({ error: { code: "FORBIDDEN", message: error.message } });
      } else {
        next(error);
      }
    }
  }

  /**
   * GET /api/friends/requests
   * Получить заявки пользователя
   */
  async getFriendRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).user?.sub;
      if (!userId) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
        return;
      }

      const requests = await this.friendService.getFriendRequests(userId);
      res.json({ requests });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/friends
   * Получить список друзей
   */
  async getFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).user?.sub;
      if (!userId) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
        return;
      }

      const friends = await this.friendService.getFriends(userId);
      res.json({ friends });
    } catch (error) {
      next(error);
    }
  }
}

export const friendController = new FriendController();


