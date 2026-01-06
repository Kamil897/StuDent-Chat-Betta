import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

/**
 * Общий rate limit для всех API запросов
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов за окно
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Слишком много запросов. Попробуйте позже.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limit для создания жалоб
 * Максимум 10 жалоб в час от одного IP
 */
export const complaintCreateRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // максимум 10 жалоб в час
  message: {
    error: {
      code: "COMPLAINT_RATE_LIMIT_EXCEEDED",
      message: "Превышен лимит создания жалоб. Попробуйте позже.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Можно добавить keyGenerator для привязки к userId вместо IP
  // keyGenerator: (req) => (req as any).user?.id || req.ip,
});

/**
 * Rate limit для auth endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа/регистрации за окно
  message: {
    error: {
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      message: "Слишком много попыток. Попробуйте позже.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

