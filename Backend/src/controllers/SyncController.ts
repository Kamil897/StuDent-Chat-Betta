import { Request, Response } from "express";
import { SyncService } from "../services/SyncService";
import { SyncData } from "../dtos/sync.dto";

/**
 * Контроллер для синхронизации данных
 */
export class SyncController {
  private syncService: SyncService;

  constructor() {
    this.syncService = new SyncService();
  }

  /**
   * POST /api/sync/push
   * Отправить данные на сервер
   */
  async push(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      // Если пользователь не авторизован, просто возвращаем успех
      if (!userId) {
        res.status(200).json({ success: true, message: "Sync skipped (not authenticated)" });
        return;
      }

      const syncData: SyncData = req.body;

      // Валидация базовой структуры
      if (!syncData || typeof syncData !== "object") {
        res.status(400).json({
          error: {
            code: "INVALID_SYNC_DATA",
            message: "Неверный формат данных синхронизации",
          },
        });
        return;
      }

      const result = await this.syncService.pushSyncData(userId, syncData);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: "SYNC_PUSH_ERROR",
          message: error.message || "Ошибка при отправке данных",
        },
      });
    }
  }

  /**
   * GET /api/sync/pull?since=:timestamp
   * Получить данные с сервера
   */
  async pull(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const since = req.query.since ? Number(req.query.since) : 0;

      // Валидация since (должно быть число >= 0)
      if (isNaN(since) || since < 0) {
        res.status(400).json({
          error: {
            code: "INVALID_SINCE_PARAMETER",
            message: "Параметр 'since' должен быть числом >= 0",
          },
        });
        return;
      }

      // Если пользователь не авторизован, возвращаем пустые данные
      if (!userId) {
        res.status(200).json({
          chats: [],
          messages: [],
          friends: [],
          leaderboard: [],
          games: [],
          timestamp: Date.now(),
        });
        return;
      }

      const syncData = await this.syncService.pullSyncData(userId, since);

      res.status(200).json(syncData);
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: "SYNC_PULL_ERROR",
          message: error.message || "Ошибка при получении данных",
        },
      });
    }
  }
}

