import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { setupChatSocket } from "./websocket/chatSocket.js";
import { setupMatchmakingSocket } from "./websocket/matchmakingSocket.js";
import { setupLeaderboardSocket } from "./websocket/leaderboardSocket.js";

const app = createApp();
const server = createServer(app);

// Настраиваем WebSocket для чатов (создает io)
const io = setupChatSocket(server);

// Настраиваем WebSocket для matchmaking
setupMatchmakingSocket(io);

// Настраиваем WebSocket для лидерборда
setupLeaderboardSocket(io);

server.listen(env.port, async () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Backend listening on http://localhost:${env.port}`);
  console.log(`📡 WebSocket server ready for real-time chat, matchmaking, and leaderboard`);
  
  // Verify email service connection
  const { emailService } = await import("./services/EmailService.js");
  await emailService.verifyConnection();
});


