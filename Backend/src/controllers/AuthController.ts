import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/AuthService.js";
import { emailVerificationService } from "../services/EmailVerificationService.js";
import type {
  LoginRequestDto,
  RefreshRequestDto,
  RegisterRequestDto,
  VerifyEmailDto,
  ResendVerificationCodeDto,
} from "../dtos/auth.dto.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as RegisterRequestDto;
      const result = await authService.register(dto);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as LoginRequestDto;
      const result = await authService.login(dto);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as RefreshRequestDto;
      const result = await authService.refreshToken(dto.refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id as string;
      if (!userId) {
        const error: any = new Error("Unauthorized");
        error.statusCode = 401;
        throw error;
      }
      await authService.logout(userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id as string;
      if (!userId) {
        const error: any = new Error("Unauthorized");
        error.statusCode = 401;
        throw error;
      }
      const user = await authService.getMe(userId);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as VerifyEmailDto;
      const result = await emailVerificationService.verifyEmail(dto.email, dto.code);
      
      if (!result.success) {
        res.status(400).json({ error: { message: result.message } });
        return;
      }

      res.json({ message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async resendVerificationCode(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as ResendVerificationCodeDto;
      const result = await emailVerificationService.sendVerificationCode(dto.email);
      
      if (!result.success) {
        res.status(400).json({ error: { message: result.message } });
        return;
      }

      res.json({ message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();




