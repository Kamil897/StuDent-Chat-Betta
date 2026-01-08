import type { RequestHandler } from "express";

export function requireRole(role: string): RequestHandler {
  return (req, _res, next) => {
    const user = (req as any).user as { id: string; roles: string[] } | undefined;
    if (!user || !user.roles.includes(role)) {
      const err: any = new Error("Forbidden");
      err.statusCode = 403;
      return next(err);
    }
    return next();
  };
}




