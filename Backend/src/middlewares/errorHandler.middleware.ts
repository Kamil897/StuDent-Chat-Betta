import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err.statusCode ?? 500;
  const message = status === 500 ? "Internal server error" : err.message;

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({
    error: {
      message,
    },
  });
};




