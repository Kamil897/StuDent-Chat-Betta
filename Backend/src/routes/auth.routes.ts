import { Router } from "express";
import { authController } from "../controllers/AuthController.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { registerSchema, loginSchema, refreshSchema } from "../validators/auth.validators.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), (req, res, next) =>
  authController.register(req, res, next),
);

authRouter.post("/login", validateBody(loginSchema), (req, res, next) =>
  authController.login(req, res, next),
);

authRouter.post("/refresh", validateBody(refreshSchema), (req, res, next) =>
  authController.refresh(req, res, next),
);

authRouter.post("/logout", authMiddleware, (req, res, next) =>
  authController.logout(req, res, next),
);

authRouter.get("/me", authMiddleware, (req, res, next) =>
  authController.me(req, res, next),
);

authRouter.post("/verify-email", (req, res, next) =>
  authController.verifyEmail(req, res, next),
);

authRouter.post("/resend-verification-code", (req, res, next) =>
  authController.resendVerificationCode(req, res, next),
);




