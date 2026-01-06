import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
}

interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  username: string;
  text: string;
  type: string;
  createdAt: string;
}

// Хранилище подключенных пользователей
const connectedUsers = new Map<string, SocketUser>();
// Хранилище комнат чатов
const chatRooms = new Map<string, Set<string>>();

export function setupChatSocket(server: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware для аутентификации через JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      // Разрешаем подключение без токена (для неавторизованных пользователей)
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.jwt.accessSecret) as any;
      (socket as any).userId = decoded.sub; // JWT использует sub для userId
      (socket as any).username = decoded.username || decoded.email || decoded.name;
      next();
    } catch (error) {
      // Разрешаем подключение даже при ошибке токена
      next();
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username || "Anonymous";

    if (userId) {
      const user: SocketUser = {
        userId,
        username,
        socketId: socket.id,
      };
      connectedUsers.set(userId, user);
      console.log(`[ChatSocket] User connected: ${username} (${userId})`);
    }

    // Присоединение к комнате чата
    socket.on("join_chat", (chatId: string) => {
      socket.join(chatId);
      
      if (!chatRooms.has(chatId)) {
        chatRooms.set(chatId, new Set());
      }
      if (userId) {
        chatRooms.get(chatId)!.add(userId);
      }
      
      console.log(`[ChatSocket] User ${username} joined chat ${chatId}`);
    });

    // Покидание комнаты чата
    socket.on("leave_chat", (chatId: string) => {
      socket.leave(chatId);
      
      if (chatRooms.has(chatId) && userId) {
        chatRooms.get(chatId)!.delete(userId);
        if (chatRooms.get(chatId)!.size === 0) {
          chatRooms.delete(chatId);
        }
      }
      
      console.log(`[ChatSocket] User ${username} left chat ${chatId}`);
    });

    // Отправка сообщения
    socket.on("send_message", (message: ChatMessage) => {
      if (!userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      // Проверяем, что пользователь в комнате
      const room = chatRooms.get(message.chatId);
      if (!room || !room.has(userId)) {
        socket.emit("error", { message: "Not in chat room" });
        return;
      }

      // Отправляем сообщение всем в комнате
      io.to(message.chatId).emit("new_message", {
        ...message,
        userId,
        username,
        createdAt: new Date().toISOString(),
      });

      console.log(`[ChatSocket] Message sent in chat ${message.chatId} by ${username}`);
    });

    // Typing indicator
    socket.on("typing_start", (chatId: string) => {
      socket.to(chatId).emit("user_typing", {
        userId,
        username,
        chatId,
      });
    });

    socket.on("typing_stop", (chatId: string) => {
      socket.to(chatId).emit("user_stopped_typing", {
        userId,
        username,
        chatId,
      });
    });

    // Отключение
    socket.on("disconnect", () => {
      if (userId) {
        connectedUsers.delete(userId);
        // Удаляем пользователя из всех комнат
        chatRooms.forEach((users, chatId) => {
          users.delete(userId);
          if (users.size === 0) {
            chatRooms.delete(chatId);
          }
        });
        console.log(`[ChatSocket] User disconnected: ${username} (${userId})`);
      }
    });
  });

  return io;
}


