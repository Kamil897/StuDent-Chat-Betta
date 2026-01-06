import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { httpLogger } from "./config/logger.js";
import { corsMiddleware } from "./middlewares/cors.middleware.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware);
  // Увеличиваем лимит для синхронизации больших объемов данных (10MB)
  app.use(express.json({ limit: "10mb" }));
  app.use(httpLogger);

  // Root route to avoid 404 on GET /
  app.get("/", (_req, res) => {
    res.status(200).send("StuDent Chat Backend is running");
  });

  // Stub route to silence Chrome DevTools /.well-known request
  app.get("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => {
    res.status(204).end();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.use("/api", apiRouter);

  app.use(errorHandler);

  return app;
}


