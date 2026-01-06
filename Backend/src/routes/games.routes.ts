import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { gameController } from "../controllers/GameController.js";

export const gamesRouter = Router();

gamesRouter.get("/", authMiddleware, (req, res, next) =>
  gameController.listGames(req, res, next),
);

gamesRouter.get("/unlocked", authMiddleware, (req, res, next) =>
  gameController.listUnlocked(req, res, next),
);

gamesRouter.post("/:gameId/unlock", authMiddleware, (req, res, next) =>
  gameController.unlock(req, res, next),
);



