import { Router } from "express";
import { userController } from "../controllers/UserController.js";

export const userRouter = Router();

/**
 * GET /api/users/search?q=:query&limit=:limit
 * Поиск пользователей по нику/имени
 * - Работает без авторизации (публичный поиск)
 */
userRouter.get("/search", (req, res, next) =>
  userController.searchUsers(req, res, next),
);

/**
 * GET /api/users/:id
 * Получить пользователя по ID
 * - Работает без авторизации (публичная информация)
 */
userRouter.get("/:id", (req, res, next) =>
  userController.getUserById(req, res, next),
);



