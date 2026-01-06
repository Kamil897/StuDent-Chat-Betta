import dotenv from "dotenv";

dotenv.config();

/**
 * Обёртка над process.env без жёсткого выброса ошибок.
 * Если переменная не задана, подставляется defaultValue или пустая строка.
 * Важно: для production нужно следить за корректностью .env вручную.
 */
function readEnv(key: string, defaultValue: string = ""): string {
  const value = process.env[key];
  return value !== undefined ? value : defaultValue;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(readEnv("PORT", "3001")),
  databaseUrl: readEnv("DATABASE_URL"),
  jwt: {
    accessSecret: readEnv("JWT_ACCESS_SECRET"),
    refreshSecret: readEnv("JWT_REFRESH_SECRET"),
    accessExpiresIn: readEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
    refreshExpiresIn: readEnv("JWT_REFRESH_EXPIRES_IN", "7d"),
  },
  corsOrigin: readEnv("CORS_ORIGIN", "http://localhost:5173"),
};

