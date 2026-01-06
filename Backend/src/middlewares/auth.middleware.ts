import type { RequestHandler } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err: any = new Error("Unauthorized");
    err.statusCode = 401;
    return next(err);
  }

  const token = authHeader.substring("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    (req as any).user = {
      id: payload.sub,
      roles: payload.roles,
    };
    return next();
  } catch {
    const err: any = new Error("Unauthorized");
    err.statusCode = 401;
    return next(err);
  }
};


