import type { Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService.js";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * GET /api/users/search?q=:query&limit=:limit
   * Поиск пользователей по нику/имени
   */
  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      if (!query || query.trim().length < 2) {
        res.json({ users: [] });
        return;
      }

      const users = await this.userService.searchUsers(query, limit);
      res.json({ users });
    } catch (err: any) {
      console.error("[UserController] Search users error:", err);
      // Возвращаем пустой массив вместо ошибки для лучшего UX
      res.json({ users: [] });
    }
  }

  /**
   * GET /api/users/:id
   * Получить пользователя по ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        });
        return;
      }

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();


