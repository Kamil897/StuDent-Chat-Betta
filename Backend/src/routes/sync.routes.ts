import { Router } from "express";
import { SyncController } from "../controllers/SyncController";

const router = Router();
const syncController = new SyncController();

/**
 * POST /api/sync/push
 * Отправить данные на сервер
 * - Работает без авторизации (возвращает пустой ответ, если не авторизован)
 */
router.post(
  "/push",
  syncController.push.bind(syncController)
);

/**
 * GET /api/sync/pull?since=:timestamp
 * Получить данные с сервера
 * - Работает без авторизации (возвращает пустые данные, если не авторизован)
 */
router.get(
  "/pull",
  syncController.pull.bind(syncController)
);

export default router;

