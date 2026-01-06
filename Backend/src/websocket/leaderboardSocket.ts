import { Server as SocketIOServer } from "socket.io";
import { LeaderboardRepository } from "../repositories/LeaderboardRepository.js";
import { leaderboardEmitter } from "../utils/leaderboardEmitter.js";

const leaderboardRepository = new LeaderboardRepository();

export function setupLeaderboardSocket(io: SocketIOServer) {
  const leaderboardNamespace = io.of("/leaderboard");

  leaderboardNamespace.on("connection", (socket) => {
    console.log(`[LeaderboardSocket] Client connected: ${socket.id}`);

    // Отправляем текущий лидерборд при подключении
    const sendLeaderboard = async () => {
      try {
        const entries = await leaderboardRepository.getTop(50, 0);
        const leaderboard = entries.map((entry: any, index: number) => ({
          id: entry.user.id,
          username: entry.user.username,
          name: `${entry.user.name} ${entry.user.surname || ""}`.trim() || entry.user.username,
          email: entry.user.email,
          points: entry.points,
          avatarSeed: entry.user.avatarSeed,
          rank: index + 1,
        }));
        socket.emit("leaderboard_update", { leaderboard });
      } catch (error) {
        console.error("[LeaderboardSocket] Error sending leaderboard:", error);
      }
    };

    sendLeaderboard();

    // Подписка на обновления лидерборда
    socket.on("subscribe", () => {
      console.log(`[LeaderboardSocket] Client ${socket.id} subscribed to updates`);
    });

    // Отключение
    socket.on("disconnect", () => {
      console.log(`[LeaderboardSocket] Client disconnected: ${socket.id}`);
    });
  });

  // Функция для рассылки обновлений всем подключенным клиентам
  const broadcastLeaderboardUpdate = async () => {
    try {
      const entries = await leaderboardRepository.getTop(50, 0);
      const leaderboard = entries.map((entry: any, index: number) => ({
        id: entry.user.id,
        username: entry.user.username,
        name: `${entry.user.name} ${entry.user.surname || ""}`.trim() || entry.user.username,
        email: entry.user.email,
        points: entry.points,
        avatarSeed: entry.user.avatarSeed,
        rank: index + 1,
      }));
      leaderboardNamespace.emit("leaderboard_update", { leaderboard });
    } catch (error) {
      console.error("[LeaderboardSocket] Error broadcasting leaderboard:", error);
    }
  };

  // Периодически обновляем лидерборд (каждые 5 секунд)
  setInterval(broadcastLeaderboardUpdate, 5000);

  // Слушаем события обновления лидерборда и сразу рассылаем обновления
  leaderboardEmitter.on("leaderboard_updated", () => {
    broadcastLeaderboardUpdate();
  });

  return leaderboardNamespace;
}

