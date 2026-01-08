import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { leaderboardController } from "../controllers/LeaderboardController.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", authMiddleware, (req, res, next) =>
  leaderboardController.getLeaderboard(req, res, next),
);




