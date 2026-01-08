import { Router } from "express";
import { friendController } from "../controllers/FriendController.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const friendRouter = Router();

/**
 * POST /api/friends/request
 * Отправить заявку в друзья по нику/имени
 */
friendRouter.post(
  "/request",
  authMiddleware,
  (req, res, next) => friendController.sendFriendRequest(req, res, next)
);

/**
 * POST /api/friends/accept/:requestId
 * Принять заявку в друзья
 */
friendRouter.post(
  "/accept/:requestId",
  authMiddleware,
  (req, res, next) => friendController.acceptFriendRequest(req, res, next)
);

/**
 * POST /api/friends/reject/:requestId
 * Отклонить заявку в друзья
 */
friendRouter.post(
  "/reject/:requestId",
  authMiddleware,
  (req, res, next) => friendController.rejectFriendRequest(req, res, next)
);

/**
 * GET /api/friends/requests
 * Получить заявки пользователя
 */
friendRouter.get(
  "/requests",
  authMiddleware,
  (req, res, next) => friendController.getFriendRequests(req, res, next)
);

/**
 * GET /api/friends
 * Получить список друзей
 */
friendRouter.get(
  "/",
  authMiddleware,
  (req, res, next) => friendController.getFriends(req, res, next)
);



