import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { matchmakingController } from "../controllers/MatchmakingController.js";

export const matchmakingRouter = Router();

matchmakingRouter.post("/queue", authMiddleware, (req, res, next) =>
  matchmakingController.queue(req, res, next),
);

matchmakingRouter.post("/cancel", authMiddleware, (req, res, next) =>
  matchmakingController.cancel(req, res, next),
);

matchmakingRouter.get("/status", authMiddleware, (req, res, next) =>
  matchmakingController.status(req, res, next),
);




