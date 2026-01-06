/**
 * Moderation Bot System
 * Автоматический бот-модератор, который мониторит чаты и отправляет сообщения пользователям
 */

import {
  getMessages,
  saveMessage,
  getChatRooms,
  findDirectChatByName,
  findDirectChatByUserId,
  getOrCreateDirectChat,
  createDirectChatByName,
  getCurrentUser,
  type Message,
  type ChatRoom,
} from "./chatStorage";
import { getChatModeration, type ModerationResult, type UserModerationStatus } from "./chatModeration";

const MODERATOR_BOT_ID = "moderator_bot";
const MODERATOR_BOT_USERNAME = "🤖 Модератор";

interface ModerationNotification {
  userId: string;
  userName: string;
  violationType: string;
  action: string;
  reason: string;
  warningsCount: number;
  violationsCount: number;
  muteUntil?: string;
  duration?: string;
}

class ModerationBot {
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private isMonitoring: boolean = false;
  private checkedMessages: Set<string> = new Set(); // ID проверенных сообщений
  private sentNotifications: Set<string> = new Set(); // ID уже отправленных уведомлений (userId + violationType + timestamp)
  private moderation = getChatModeration();
  private startCount: number = 0; // Счетчик запусков для отладки

  /**
   * Начать мониторинг всех чатов
   */
  startMonitoring(intervalMs: number = 5000): void {
    // Если уже запущен, не запускаем снова
    if (this.isMonitoring && this.monitoringInterval) {
      return;
    }

    // Очищаем предыдущий интервал если есть
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = true;
    this.startCount++;
    
    // Логируем только при первом запуске
    if (this.startCount === 1) {
      console.log(`🤖 Бот-модератор запущен. Проверка каждые ${intervalMs / 1000} секунд`);
    }

    // Немедленная проверка
    this.checkAllMessages();

    // Периодическая проверка
    this.monitoringInterval = setInterval(() => {
      this.checkAllMessages();
    }, intervalMs);
  }

  /**
   * Остановить мониторинг
   */
  stopMonitoring(): void {
    // Останавливаем только если действительно запущен
    if (!this.isMonitoring && !this.monitoringInterval) {
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.isMonitoring) {
      this.isMonitoring = false;
      this.startCount = 0; // Сбрасываем счетчик
      // Не логируем остановку, чтобы не засорять консоль при ререндерах
    }
  }

  /**
   * Проверить все сообщения во всех чатах
   */
  private checkAllMessages(): void {
    const rooms = getChatRooms();
    
    if (rooms.length === 0) {
      return; // Нет чатов для проверки
    }
    
    rooms.forEach((room) => {
      const messages = getMessages(room.id);
      
      if (messages.length === 0) {
        return; // Нет сообщений в этом чате
      }
      
      messages.forEach((message) => {
        // Пропускаем сообщения от бота-модератора
        if (message.userId === MODERATOR_BOT_ID) {
          return;
        }

        // Пропускаем уже проверенные сообщения (но только если они не содержат нарушений)
        // Если сообщение было проверено и нарушение найдено, не проверяем снова
        if (this.checkedMessages.has(message.id)) {
          return;
        }

        // Проверяем сообщение через систему модерации
        const moderationResult = this.moderateMessage(message, room);

        if (moderationResult) {
          // Отправляем уведомление пользователю
          console.log(`🔍 Нарушение обнаружено: ${message.username} - ${moderationResult.violationType}`);
          this.sendModerationNotification(moderationResult);
          this.checkedMessages.add(message.id);
        } else {
          // Если сообщение прошло проверку, тоже помечаем как проверенное
          this.checkedMessages.add(message.id);
        }
      });
    });
  }

  /**
   * Проверить сообщение на нарушения
   */
  private moderateMessage(message: Message, room: ChatRoom): ModerationNotification | null {
    // Проверяем сообщение
    const result: ModerationResult = this.moderation.checkMessage(
      message.text,
      message.userId,
      message.username,
      room.id
    );

    // Если нарушение обнаружено или применено действие
    if (!result.allowed || result.warning || result.action) {
      const userStatus: UserModerationStatus = this.moderation.getUserStatus(message.userId);

      const notification: ModerationNotification = {
        userId: message.userId,
        userName: message.username,
        violationType: this.getViolationTypeName(result.action || "unknown"),
        action: result.action || "warning",
        reason: result.reason || result.message || "Нарушение правил чата",
        warningsCount: userStatus.warnings_count,
        violationsCount: userStatus.violations_count_24h,
        muteUntil: result.mute_until,
        duration: result.duration_minutes
          ? this.formatDuration(result.duration_minutes)
          : undefined,
      };

      return notification;
    }

    return null;
  }

  /**
   * Отправить уведомление пользователю в личный чат
   */
  private async sendModerationNotification(notification: ModerationNotification): Promise<void> {
    try {
      // Создаем уникальный ключ для этого уведомления (userId + action + violationsCount)
      // Это предотвратит отправку дубликатов для одного и того же нарушения
      const notificationKey = `${notification.userId}_${notification.action}_${notification.violationsCount}`;
      
      // Проверяем, не отправляли ли мы уже это уведомление
      if (this.sentNotifications.has(notificationKey)) {
        console.log(`⏭️ Уведомление уже отправлено пользователю ${notification.userName} для действия ${notification.action}`);
        return;
      }

      // Создаем или находим личный чат с пользователем (передаем userId для надежности)
      const directChat = await this.getOrCreateModeratorChat(notification.userName, notification.userId);

      if (!directChat) {
        console.error(`Не удалось создать чат с пользователем ${notification.userName} (ID: ${notification.userId})`);
        return;
      }

      // Проверяем, нет ли уже такого сообщения в чате
      const existingMessages = getMessages(directChat.id);
      const hasSimilarMessage = existingMessages.some(msg => 
        msg.userId === MODERATOR_BOT_ID && 
        msg.text.includes(notification.reason) &&
        // Проверяем что сообщение не старше 1 минуты (чтобы не блокировать новые нарушения)
        (Date.now() - new Date(msg.createdAt).getTime()) < 60000
      );

      if (hasSimilarMessage) {
        console.log(`⏭️ Похожее уведомление уже есть в чате для ${notification.userName}`);
        this.sentNotifications.add(notificationKey);
        return;
      }

      // Формируем сообщение от модератора
      const moderationMessage = this.createModerationMessage(notification);

      // Генерируем уникальный ID (userId + timestamp + random)
      const uniqueId = `mod_msg_${notification.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Отправляем сообщение
      const botMessage: Message = {
        id: uniqueId,
        chatId: directChat.id,
        userId: MODERATOR_BOT_ID,
        username: MODERATOR_BOT_USERNAME,
        text: moderationMessage,
        type: "text",
        createdAt: new Date().toISOString(),
      };

      saveMessage(botMessage);
      this.sentNotifications.add(notificationKey);
      console.log(`📨 Отправлено уведомление модерации пользователю ${notification.userName}`);

      // Обновляем UI если чат открыт (через событие)
      this.notifyMessageSent(directChat.id);
    } catch (error) {
      console.error("Ошибка при отправке уведомления модерации:", error);
    }
  }

  /**
   * Получить или создать личный чат с модератором (как в Telegram - один чат на пользователя)
   */
  private async getOrCreateModeratorChat(userName: string, userId?: string): Promise<ChatRoom | null> {
    try {
      const currentUser = getCurrentUser();
      
      // Если есть userId, используем его для поиска (более надежно)
      if (userId) {
        // Ищем существующий чат по ID пользователя
        let chat = findDirectChatByUserId(userId);
        
        if (chat) {
          // Убеждаемся что бот-модератор в участниках
          await this.ensureModeratorInChat(chat);
          return chat;
        }
        
        // Если не нашли, создаем новый используя getOrCreateDirectChat
        chat = getOrCreateDirectChat(userId, userName);
        
        if (chat) {
          await this.ensureModeratorInChat(chat);
          return chat;
        }
      }
      
      // Fallback: поиск по имени (для обратной совместимости)
      let chat = findDirectChatByName(userName);
      
      if (chat) {
        // Обновляем members если есть userId
        if (userId && !chat.members.includes(userId)) {
          chat.members = [currentUser.id, userId];
          const rooms = getChatRooms();
          const index = rooms.findIndex(r => r.id === chat!.id);
          if (index !== -1) {
            rooms[index] = chat;
            const { saveChatRooms } = await import("./chatStorage");
            saveChatRooms(rooms);
          }
        }
        await this.ensureModeratorInChat(chat);
        return chat;
      }
      
      // Если чата нет, создаем через createDirectChatByName
      const { findUserByNameOrUsername, registerUser } = await import("./userSearch");
      let targetUser = findUserByNameOrUsername(userName);
      
      if (!targetUser && userId) {
        const { getUserById } = await import("./userSearch");
        targetUser = getUserById(userId);
        
        if (!targetUser) {
          targetUser = {
            id: userId,
            username: userName,
            name: userName,
          };
          registerUser(targetUser);
        }
      }
      
      if (targetUser) {
        chat = await createDirectChatByName(targetUser.name || targetUser.username);
        if (chat) {
          await this.ensureModeratorInChat(chat);
          return chat;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Ошибка при создании чата с модератором:", error);
      return null;
    }
  }
  
  /**
   * Убедиться что модератор в участниках чата
   */
  private async ensureModeratorInChat(chat: ChatRoom): Promise<void> {
    if (!chat.memberNames) {
      chat.memberNames = [];
    }
    if (!chat.memberNames.includes(MODERATOR_BOT_USERNAME)) {
      chat.memberNames.push(MODERATOR_BOT_USERNAME);
    }
    if (!chat.members.includes(MODERATOR_BOT_ID)) {
      chat.members.push(MODERATOR_BOT_ID);
    }
    
    // Сохраняем обновленный чат
    const rooms = getChatRooms();
    const roomIndex = rooms.findIndex((r) => r.id === chat.id);
    if (roomIndex !== -1) {
      rooms[roomIndex] = chat;
      const { saveChatRooms } = await import("./chatStorage");
      saveChatRooms(rooms);
    }
  }

  /**
   * Создать текст сообщения модерации
   */
  private createModerationMessage(notification: ModerationNotification): string {
    let message = `⚠️ **Уведомление системы модерации**\n\n`;
    
    message += `**Причина:** ${notification.reason}\n\n`;
    message += `**Тип нарушения:** ${this.getViolationTypeName(notification.violationType)}\n\n`;

    // Информация о действии
    if (notification.action === "warning") {
      message += `🔔 **Применено действие:** Предупреждение\n\n`;
      message += `У вас уже ${notification.warningsCount} предупреждений.\n`;
      message += `Всего нарушений за 24 часа: ${notification.violationsCount}\n\n`;
      message += `⚠️ Пожалуйста, соблюдайте правила чата. При повторных нарушениях могут быть применены более строгие меры.\n\n`;
    } else if (notification.action.startsWith("mute_")) {
      message += `🔇 **Применено действие:** Мут\n\n`;
      if (notification.duration) {
        message += `**Длительность:** ${notification.duration}\n\n`;
      }
      if (notification.muteUntil) {
        const muteDate = new Date(notification.muteUntil);
        message += `**Мут до:** ${muteDate.toLocaleString("ru-RU")}\n\n`;
      }
      message += `У вас ${notification.warningsCount} предупреждений.\n`;
      message += `Всего нарушений за 24 часа: ${notification.violationsCount}\n\n`;
      message += `🔇 Вы временно не можете отправлять сообщения в чаты.\n\n`;
    } else if (notification.action === "ban") {
      message += `🚫 **Применено действие:** Бан\n\n`;
      message += `У вас было ${notification.warningsCount} предупреждений.\n`;
      message += `Всего нарушений за 24 часа: ${notification.violationsCount}\n\n`;
      message += `🚫 Ваш аккаунт заблокирован за систематические нарушения правил чата.\n\n`;
    }

    // Методы наказания
    message += `**Система наказаний:**\n`;
    message += `• 1-2 нарушения → Предупреждение\n`;
    message += `• 3-4 нарушения → Мут на 5 минут\n`;
    message += `• 5-6 нарушений → Мут на 1 час\n`;
    message += `• 7-9 нарушений → Мут на 1 день\n`;
    message += `• 10+ нарушений → Бан\n\n`;

    message += `Если у вас есть вопросы, обратитесь к администраторам.\n\n`;
    message += `---\n`;
    message += `*Это автоматическое сообщение от системы модерации*`;

    return message;
  }

  /**
   * Получить название типа нарушения
   */
  private getViolationTypeName(type: string): string {
    const names: Record<string, string> = {
      spam: "Спам",
      profanity: "Нецензурная лексика",
      harassment: "Харассмент",
      hate_speech: "Разжигание ненависти",
      inappropriate_content: "Неуместный контент",
      caps_lock: "CAPS LOCK",
      flood: "Флуд",
      unknown: "Неизвестное нарушение",
    };

    return names[type] || type;
  }

  /**
   * Форматировать длительность
   */
  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} минут`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} час(ов)`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} день(дней)`;
    }
  }

  /**
   * Уведомить о новом сообщении (для обновления UI)
   */
  private notifyMessageSent(chatId: string): void {
    // Создаем кастомное событие для обновления UI
    window.dispatchEvent(
      new CustomEvent("moderationMessageSent", {
        detail: { chatId },
      })
    );
  }

  /**
   * Проверить одно сообщение вручную (для немедленной проверки)
   */
  checkMessage(message: Message, room: ChatRoom): void {
    // Пропускаем сообщения от бота-модератора
    if (message.userId === MODERATOR_BOT_ID) {
      return;
    }

    // Проверяем сообщение
    const result = this.moderateMessage(message, room);
    if (result) {
      console.log(`🔍 Нарушение обнаружено (немедленная проверка): ${message.username} - ${result.violationType}`);
      this.sendModerationNotification(result);
      this.checkedMessages.add(message.id);
    } else {
      // Помечаем как проверенное даже если нарушений нет
      this.checkedMessages.add(message.id);
    }
  }

  /**
   * Тестовая функция для проверки работы модерации
   */
  testModeration(testMessage: string, userId: string, userName: string, chatId: string): void {
    console.log(`🧪 Тестирование модерации: "${testMessage}"`);
    const result = this.moderation.checkMessage(testMessage, userId, userName, chatId);
    console.log("Результат проверки:", result);
    
    if (result.warning || result.action || !result.allowed) {
      const userStatus = this.moderation.getUserStatus(userId);
      const notification: ModerationNotification = {
        userId,
        userName,
        violationType: this.getViolationTypeName(result.action || "unknown"),
        action: result.action || "warning",
        reason: result.reason || result.message || "Нарушение правил чата",
        warningsCount: userStatus.warnings_count,
        violationsCount: userStatus.violations_count_24h,
        muteUntil: result.mute_until,
        duration: result.duration_minutes
          ? this.formatDuration(result.duration_minutes)
          : undefined,
      };
      console.log("Уведомление будет отправлено:", notification);
    } else {
      console.log("✅ Сообщение прошло проверку без нарушений");
    }
  }

  /**
   * Очистить список проверенных сообщений (для тестирования)
   */
  clearCheckedMessages(): void {
    this.checkedMessages.clear();
    this.sentNotifications.clear();
    console.log("🧹 Список проверенных сообщений и уведомлений очищен");
  }
}

// Глобальный экземпляр бота
let moderationBotInstance: ModerationBot | null = null;

export function getModerationBot(): ModerationBot {
  if (!moderationBotInstance) {
    moderationBotInstance = new ModerationBot();
  }
  return moderationBotInstance;
}

export function startModerationMonitoring(intervalMs: number = 5000): void {
  const bot = getModerationBot();
  bot.startMonitoring(intervalMs);
}

export function stopModerationMonitoring(): void {
  const bot = getModerationBot();
  bot.stopMonitoring();
}

/**
 * Тестовая функция для проверки работы модерации
 * Использование: testModeration("ПРИВЕТ ВСЕМ", "user1", "TestUser", "chat1")
 */
export function testModeration(testMessage: string, userId: string = "test_user", userName: string = "TestUser", chatId: string = "test_chat"): void {
  const bot = getModerationBot();
  bot.testModeration(testMessage, userId, userName, chatId);
}

/**
 * Очистить список проверенных сообщений (для тестирования)
 */
export function clearCheckedMessages(): void {
  const bot = getModerationBot();
  bot.clearCheckedMessages();
}

// Экспортируем функции в window для тестирования в консоли
if (typeof window !== "undefined") {
  (window as any).testModeration = testModeration;
  (window as any).clearCheckedMessages = clearCheckedMessages;
  console.log("🧪 Тестовые функции доступны в консоли:");
  console.log("  - testModeration('ПРИВЕТ ВСЕМ') - протестировать сообщение");
  console.log("  - clearCheckedMessages() - очистить список проверенных сообщений");
}

