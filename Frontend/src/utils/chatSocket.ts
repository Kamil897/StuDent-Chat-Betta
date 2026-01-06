import { io, Socket } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let chatSocket: Socket | null = null;

/**
 * Подключиться к WebSocket серверу для чатов
 */
export function connectChatSocket(): Socket | null {
  if (chatSocket?.connected) {
    return chatSocket;
  }

  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

  chatSocket = io(API_BASE_URL, {
    auth: {
      token: token || undefined,
    },
    transports: ["websocket", "polling"],
  });

  chatSocket.on("connect", () => {
    console.log("[ChatSocket] Connected to server");
  });

  chatSocket.on("disconnect", () => {
    console.log("[ChatSocket] Disconnected from server");
  });

  chatSocket.on("error", (error) => {
    console.error("[ChatSocket] Error:", error);
  });

  return chatSocket;
}

/**
 * Отключиться от WebSocket сервера
 */
export function disconnectChatSocket() {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
}

/**
 * Получить текущее подключение
 */
export function getChatSocket(): Socket | null {
  return chatSocket;
}

/**
 * Присоединиться к комнате чата
 */
export function joinChatRoom(chatId: string) {
  if (!chatSocket) {
    connectChatSocket();
  }
  if (chatSocket) {
    chatSocket.emit("join_chat", chatId);
  }
}

/**
 * Покинуть комнату чата
 */
export function leaveChatRoom(chatId: string) {
  if (chatSocket) {
    chatSocket.emit("leave_chat", chatId);
  }
}

/**
 * Отправить сообщение через WebSocket
 */
export function sendChatMessage(message: {
  id: string;
  chatId: string;
  userId: string;
  username: string;
  text: string;
  type: string;
}) {
  if (chatSocket) {
    chatSocket.emit("send_message", {
      ...message,
      createdAt: new Date().toISOString(),
    });
  }
}

/**
 * Подписаться на новые сообщения
 */
export function onNewMessage(callback: (message: any) => void) {
  if (!chatSocket) {
    connectChatSocket();
  }
  if (chatSocket) {
    chatSocket.on("new_message", callback);
  }
}

/**
 * Отписаться от новых сообщений
 */
export function offNewMessage(callback: (message: any) => void) {
  if (chatSocket) {
    chatSocket.off("new_message", callback);
  }
}

/**
 * Подписаться на typing indicator
 */
export function onUserTyping(callback: (data: { userId: string; username: string; chatId: string }) => void) {
  if (!chatSocket) {
    connectChatSocket();
  }
  if (chatSocket) {
    chatSocket.on("user_typing", callback);
  }
}

/**
 * Отправить typing indicator
 */
export function sendTypingStart(chatId: string) {
  if (chatSocket) {
    chatSocket.emit("typing_start", chatId);
  }
}

export function sendTypingStop(chatId: string) {
  if (chatSocket) {
    chatSocket.emit("typing_stop", chatId);
  }
}


