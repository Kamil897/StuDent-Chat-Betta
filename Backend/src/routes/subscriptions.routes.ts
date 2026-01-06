import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { subscriptionController } from "../controllers/SubscriptionController.js";

export const subscriptionsRouter = Router();

subscriptionsRouter.get("/", authMiddleware, (req, res, next) =>
  subscriptionController.list(req, res, next),
);

subscriptionsRouter.post("/activate", authMiddleware, (req, res, next) =>
  subscriptionController.activate(req, res, next),
);



