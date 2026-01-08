import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { achievementController } from "../controllers/AchievementController.js";

export const achievementsRouter = Router();

achievementsRouter.get("/", authMiddleware, (req, res, next) =>
  achievementController.listAll(req, res, next),
);

achievementsRouter.get("/me", authMiddleware, (req, res, next) =>
  achievementController.listUser(req, res, next),
);

achievementsRouter.post("/unlock", authMiddleware, (req, res, next) =>
  achievementController.unlock(req, res, next),
);




