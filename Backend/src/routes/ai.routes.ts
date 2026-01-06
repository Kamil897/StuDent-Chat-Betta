import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { aiController } from "../controllers/AiController.js";

export const aiRouter = Router();

// Cognia assistant
aiRouter.post(
  "/cognia/message",
  authMiddleware,
  (req, res, next) => aiController.cognia(req, res, next),
);

// Trai assistant
aiRouter.post(
  "/trai/message",
  authMiddleware,
  (req, res, next) => aiController.trai(req, res, next),
);



