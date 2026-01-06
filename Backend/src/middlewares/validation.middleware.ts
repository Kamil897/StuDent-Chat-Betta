import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(", ");
      const err: any = new Error(message);
      err.statusCode = 400;
      return next(err);
    }
    req.body = result.data;
    return next();
  };
}

export function validateQuery(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(", ");
      const err: any = new Error(message);
      err.statusCode = 400;
      return next(err);
    }
    req.query = result.data as any;
    return next();
  };
}


