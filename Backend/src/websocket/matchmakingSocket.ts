import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { MatchmakingService } from "../services/MatchmakingService.js";

const matchmakingService = new MatchmakingService();

interface MatchmakingUser {
  userId: string;
  username: string;
  socketId: string;
  gameId: string;
}

// Хранилище пользователей в очереди matchmaking
const matchmakingQueue = new Map<string, MatchmakingUser>();

export function setupMatchmakingSocket(io: SocketIOServer) {
  const matchmakingNamespace = io.of("/matchmaking");

  // Middleware для аутентификации
  matchmakingNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, env.jwt.accessSecret) as any;
      (socket as any).userId = decoded.sub; // JWT использует sub для userId
      (socket as any).username = decoded.username || decoded.email || decoded.name;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  matchmakingNamespace.on("connection", (socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username || "Anonymous";

    console.log(`[MatchmakingSocket] User connected: ${username} (${userId})`);

    // Поиск матча
    socket.on("find_match", async (data: { gameId: string }) => {
      if (!userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const { gameId } = data;
      if (!gameId) {
        socket.emit("error", { message: "gameId is required" });
        return;
      }

      try {
        // Добавляем в очередь на бэкенде
        const result = await matchmakingService.queue(userId, gameId);

        if (!result.searching) {
          // Матч найден сразу
          socket.emit("match_found", {
            matchId: result.matchId,
            opponentId: result.opponentId,
            gameId,
          });

          // Уведомляем оппонента
          const opponent = matchmakingQueue.get(result.opponentId);
          if (opponent) {
            matchmakingNamespace.to(opponent.socketId).emit("match_found", {
              matchId: result.matchId,
              opponentId: userId,
              gameId,
            });
            matchmakingQueue.delete(result.opponentId);
          }
          matchmakingQueue.delete(userId);
        } else {
          // Добавляем в очередь на WebSocket
          matchmakingQueue.set(userId, {
            userId,
            username,
            socketId: socket.id,
            gameId,
          });

          socket.emit("searching", { gameId });

          // Периодически проверяем статус и пытаемся найти оппонента через базу данных
          const checkInterval = setInterval(async () => {
            try {
              // Проверяем статус через сервис (который проверяет базу данных)
              const status = await matchmakingService.status(userId);
              
              if (!status.searching) {
                // Матч найден!
                clearInterval(checkInterval);
                matchmakingQueue.delete(userId);

                socket.emit("match_found", {
                  matchId: status.matchId,
                  opponentId: status.opponentId,
                  gameId: status.gameId,
                });

                // Уведомляем оппонента если он подключен через WebSocket
                const opponent = matchmakingQueue.get(status.opponentId);
                if (opponent) {
                  matchmakingNamespace.to(opponent.socketId).emit("match_found", {
                    matchId: status.matchId,
                    opponentId: userId,
                    gameId: status.gameId,
                  });
                  matchmakingQueue.delete(status.opponentId);
                }
              } else {
                // Продолжаем искать - проверяем базу данных на наличие оппонентов
                // Используем findOpponent напрямую вместо повторного вызова queue
                try {
                  const { MatchmakingRepository } = await import("../repositories/MatchmakingRepository.js");
                  const matchmakingRepo = new MatchmakingRepository();
                  const opponentQueue = await matchmakingRepo.findOpponent(userId, gameId);
                  
                  if (opponentQueue) {
                    // Нашли оппонента! Создаем матч через сервис
                    const newResult = await matchmakingService.queue(userId, gameId);
                    if (!newResult.searching) {
                      // Нашли оппонента!
                      clearInterval(checkInterval);
                      matchmakingQueue.delete(userId);

                      socket.emit("match_found", {
                        matchId: newResult.matchId,
                        opponentId: newResult.opponentId,
                        gameId,
                      });

                      // Уведомляем оппонента
                      const opponent = matchmakingQueue.get(newResult.opponentId);
                      if (opponent) {
                        matchmakingNamespace.to(opponent.socketId).emit("match_found", {
                          matchId: newResult.matchId,
                          opponentId: userId,
                          gameId,
                        });
                        matchmakingQueue.delete(newResult.opponentId);
                      }
                    }
                  }
                } catch (error) {
                  // Игнорируем ошибки при поиске оппонента
                  console.error(`[MatchmakingSocket] Error finding opponent:`, error);
                }
              }
            } catch (error) {
              console.error(`[MatchmakingSocket] Error checking status:`, error);
            }
          }, 2000); // Проверяем каждые 2 секунды

          // Очищаем интервал при отключении
          socket.on("disconnect", () => {
            clearInterval(checkInterval);
          });
        }
      } catch (error: any) {
        console.error(`[MatchmakingSocket] Error finding match:`, error);
        socket.emit("error", { message: error.message || "Failed to find match" });
      }
    });

    // Отмена поиска
    socket.on("cancel_search", async () => {
      if (!userId) return;

      try {
        await matchmakingService.cancel(userId);
        matchmakingQueue.delete(userId);
        socket.emit("search_cancelled");
      } catch (error: any) {
        console.error(`[MatchmakingSocket] Error cancelling search:`, error);
        socket.emit("error", { message: error.message || "Failed to cancel search" });
      }
    });

    // Отключение
    socket.on("disconnect", () => {
      if (userId) {
        matchmakingQueue.delete(userId);
        // Отменяем поиск на бэкенде
        matchmakingService.cancel(userId).catch(console.error);
        console.log(`[MatchmakingSocket] User disconnected: ${username} (${userId})`);
      }
    });
  });

  return matchmakingNamespace;
}


