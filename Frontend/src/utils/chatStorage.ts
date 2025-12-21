export type ChatType = "channel" | "direct" | "group";
export type ChannelCategory = "subject" | "university" | "country" | "interest";

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: ChatType;
  category?: ChannelCategory;
  description?: string;
  icon?: string | React.ReactNode;
  members: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  username: string;
  text: string;
  type: "text" | "file" | "voice";
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  mentions?: string[];
  reactions?: Record<string, string[]>;
  createdAt: string;
}

const STORAGE_KEY_ROOMS = "chatRooms";
const STORAGE_KEY_MESSAGES = "chatMessages";
const STORAGE_KEY_USER = "currentUser";

export function getCurrentUser(): User {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading current user:", e);
  }
  
  // Default user if none exists
  const defaultUser: User = {
    id: "user_1",
    username: "User",
    email: "user@example.com",
  };
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(defaultUser));
  return defaultUser;
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

export function getChatRooms(): ChatRoom[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading chat rooms:", e);
  }
  return [];
}

export function saveChatRooms(rooms: ChatRoom[]): void {
  localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
}

export function createChatRoom(
  name: string,
  type: ChatType,
  category?: ChannelCategory
): ChatRoom {
  const user = getCurrentUser();
  const room: ChatRoom = {
    id: `room_${Date.now()}`,
    name,
    type,
    category,
    members: [user.id],
    createdAt: new Date().toISOString(),
  };

  const rooms = getChatRooms();
  rooms.push(room);
  saveChatRooms(rooms);
  return room;
}

export function getMessages(chatId: string): Message[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (stored) {
      const allMessages: Message[] = JSON.parse(stored);
      return allMessages.filter((m) => m.chatId === chatId);
    }
  } catch (e) {
    console.error("Error loading messages:", e);
  }
  return [];
}

export function saveMessage(message: Message): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const allMessages: Message[] = stored ? JSON.parse(stored) : [];
    allMessages.push(message);
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(allMessages));
  } catch (e) {
    console.error("Error saving message:", e);
  }
}

export function addReaction(
  chatId: string,
  messageId: string,
  emoji: string,
  userId: string
): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!stored) return;

    const allMessages: Message[] = JSON.parse(stored);
    const message = allMessages.find((m) => m.id === messageId && m.chatId === chatId);
    if (!message) return;

    if (!message.reactions) {
      message.reactions = {};
    }
    if (!message.reactions[emoji]) {
      message.reactions[emoji] = [];
    }
    if (!message.reactions[emoji].includes(userId)) {
      message.reactions[emoji].push(userId);
    }

    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(allMessages));
  } catch (e) {
    console.error("Error adding reaction:", e);
  }
}

export function removeReaction(
  chatId: string,
  messageId: string,
  emoji: string,
  userId: string
): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!stored) return;

    const allMessages: Message[] = JSON.parse(stored);
    const message = allMessages.find((m) => m.id === messageId && m.chatId === chatId);
    if (!message || !message.reactions || !message.reactions[emoji]) return;

    message.reactions[emoji] = message.reactions[emoji].filter((id) => id !== userId);
    if (message.reactions[emoji].length === 0) {
      delete message.reactions[emoji];
    }

    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(allMessages));
  } catch (e) {
    console.error("Error removing reaction:", e);
  }
}

export function parseMentions(text: string, users: User[]): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    const user = users.find((u) => u.username === username);
    if (user) {
      mentions.push(user.id);
    }
  }

  return mentions;
}

