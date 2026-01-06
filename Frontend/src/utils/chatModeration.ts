/**
 * Chat Moderation System
 * Интеграция с AI модерацией для фронтенда
 * Работает через localStorage (пока нет бэкенда)
 */

export interface ModerationResult {
  allowed: boolean;
  warning?: boolean;
  message?: string;
  reason?: string;
  action?: string;
  mute_until?: string;
  duration_minutes?: number;
}

export interface UserModerationStatus {
  is_muted: boolean;
  is_banned: boolean;
  violations_count_24h: number;
  warnings_count: number;
  mute_until?: string | null;
}

const STORAGE_KEY_VIOLATIONS = "chat_violations";
const STORAGE_KEY_ACTIONS = "moderation_actions";
const STORAGE_KEY_MUTED = "muted_users";
const STORAGE_KEY_BANNED = "banned_users";

interface Violation {
  user_id: string;
  user_name: string;
  violation_type: string;
  message: string;
  chat_id: string;
  created_at: string;
  severity: number;
}

interface ModerationAction {
  action_type: string;
  user_id: string;
  user_name: string;
  chat_id: string;
  reason: string;
  violation_type: string;
  duration_minutes?: number;
  created_at: string;
}

class ChatModeration {
  private violations: Map<string, Violation[]> = new Map();
  private actions: ModerationAction[] = [];
  private mutedUsers: Map<string, Date> = new Map();
  private bannedUsers: Set<string> = new Set();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      // Загружаем нарушения
      const violationsData = localStorage.getItem(STORAGE_KEY_VIOLATIONS);
      if (violationsData) {
        const violations = JSON.parse(violationsData);
        this.violations = new Map(Object.entries(violations));
      }

      // Загружаем действия
      const actionsData = localStorage.getItem(STORAGE_KEY_ACTIONS);
      if (actionsData) {
        this.actions = JSON.parse(actionsData);
      }

      // Загружаем замученных пользователей
      const mutedData = localStorage.getItem(STORAGE_KEY_MUTED);
      if (mutedData) {
        const muted = JSON.parse(mutedData);
        for (const [userId, unmuteTime] of Object.entries(muted)) {
          const unmuteDate = new Date(unmuteTime as string);
          if (unmuteDate > new Date()) {
            this.mutedUsers.set(userId, unmuteDate);
          }
        }
      }

      // Загружаем забаненных пользователей
      const bannedData = localStorage.getItem(STORAGE_KEY_BANNED);
      if (bannedData) {
        this.bannedUsers = new Set(JSON.parse(bannedData));
      }
    } catch (e) {
      console.error("Error loading moderation data:", e);
    }
  }

  private saveData(): void {
    try {
      // Сохраняем нарушения
      const violationsObj = Object.fromEntries(this.violations);
      localStorage.setItem(STORAGE_KEY_VIOLATIONS, JSON.stringify(violationsObj));

      // Сохраняем действия
      localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(this.actions));

      // Сохраняем замученных пользователей
      const mutedObj = Object.fromEntries(this.mutedUsers);
      localStorage.setItem(STORAGE_KEY_MUTED, JSON.stringify(mutedObj));

      // Сохраняем забаненных пользователей
      localStorage.setItem(STORAGE_KEY_BANNED, JSON.stringify(Array.from(this.bannedUsers)));
    } catch (e) {
      console.error("Error saving moderation data:", e);
    }
  }

  private analyzeMessage(
    message: string,
    userId: string,
    userName: string,
    chatId: string
  ): Violation | null {
    // Проверка на CAPS LOCK (более чувствительная - 50% вместо 70%)
    if (message.length > 5) {
      const capsCount = (message.match(/[A-ZА-ЯЁ]/g) || []).length;
      const letterCount = (message.match(/[A-ZА-ЯЁa-zа-яё]/g) || []).length;
      // Проверяем только буквы, игнорируя пробелы и знаки препинания
      if (letterCount > 0 && capsCount / letterCount > 0.5) {
        return {
          user_id: userId,
          user_name: userName,
          violation_type: "caps_lock",
          message: message,
          chat_id: chatId,
          created_at: new Date().toISOString(),
          severity: 1,
        };
      }
    }

    // Проверка на спам (повторяющиеся символы)
    if (/(.)\1{4,}/.test(message)) {
      return {
        user_id: userId,
        user_name: userName,
        violation_type: "spam",
        message: message,
        chat_id: chatId,
        created_at: new Date().toISOString(),
        severity: 2,
      };
    }

    // Проверка на флуд
    const userViolations = this.violations.get(userId) || [];
    const recentViolations = userViolations.filter((v) => {
      const violationTime = new Date(v.created_at);
      const now = new Date();
      return (now.getTime() - violationTime.getTime()) / 1000 < 60;
    });

    if (recentViolations.length >= 5) {
      return {
        user_id: userId,
        user_name: userName,
        violation_type: "flood",
        message: message,
        chat_id: chatId,
        created_at: new Date().toISOString(),
        severity: 3,
      };
    }

    return null;
  }

  private addViolation(violation: Violation): void {
    if (!this.violations.has(violation.user_id)) {
      this.violations.set(violation.user_id, []);
    }
    this.violations.get(violation.user_id)!.push(violation);
    this.saveData();
  }

  private getUserViolationsCount(userId: string, hours: number = 24): number {
    const violations = this.violations.get(userId) || [];
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return violations.filter((v) => new Date(v.created_at) > cutoffTime).length;
  }

  private getUserWarningsCount(userId: string): number {
    return this.actions.filter(
      (a) => a.user_id === userId && a.action_type === "warning"
    ).length;
  }

  private decideAction(violation: Violation): ModerationAction | null {
    const userId = violation.user_id;
    const violationsCount = this.getUserViolationsCount(userId, 24);
    const warningsCount = this.getUserWarningsCount(userId);

    // Если забанен, ничего не делаем
    if (this.bannedUsers.has(userId)) {
      return null;
    }

    // Если в муте, проверяем не истек ли
    if (this.mutedUsers.has(userId)) {
      const unmuteTime = this.mutedUsers.get(userId)!;
      if (new Date() > unmuteTime) {
        this.mutedUsers.delete(userId);
      } else {
        return null; // Все еще в муте
      }
    }

    let action: ModerationAction | null = null;

    if (violationsCount <= 2 && warningsCount < 2) {
      // Предупреждение
      action = {
        action_type: "warning",
        user_id: userId,
        user_name: violation.user_name,
        chat_id: violation.chat_id,
        reason: `Нарушение: ${violation.violation_type}`,
        violation_type: violation.violation_type,
        created_at: new Date().toISOString(),
      };
    } else if (violationsCount <= 4) {
      // Мут на 5 минут
      const unmuteTime = new Date();
      unmuteTime.setMinutes(unmuteTime.getMinutes() + 5);
      this.mutedUsers.set(userId, unmuteTime);

      action = {
        action_type: "mute_minutes",
        user_id: userId,
        user_name: violation.user_name,
        chat_id: violation.chat_id,
        reason: `Множественные нарушения: ${violation.violation_type}`,
        violation_type: violation.violation_type,
        duration_minutes: 5,
        created_at: new Date().toISOString(),
      };
    } else if (violationsCount <= 6) {
      // Мут на 1 час
      const unmuteTime = new Date();
      unmuteTime.setHours(unmuteTime.getHours() + 1);
      this.mutedUsers.set(userId, unmuteTime);

      action = {
        action_type: "mute_hours",
        user_id: userId,
        user_name: violation.user_name,
        chat_id: violation.chat_id,
        reason: `Повторные нарушения: ${violation.violation_type}`,
        violation_type: violation.violation_type,
        duration_minutes: 60,
        created_at: new Date().toISOString(),
      };
    } else if (violationsCount <= 9) {
      // Мут на 1 день
      const unmuteTime = new Date();
      unmuteTime.setDate(unmuteTime.getDate() + 1);
      this.mutedUsers.set(userId, unmuteTime);

      action = {
        action_type: "mute_days",
        user_id: userId,
        user_name: violation.user_name,
        chat_id: violation.chat_id,
        reason: `Систематические нарушения: ${violation.violation_type}`,
        violation_type: violation.violation_type,
        duration_minutes: 24 * 60,
        created_at: new Date().toISOString(),
      };
    } else {
      // Бан
      this.bannedUsers.add(userId);

      action = {
        action_type: "ban",
        user_id: userId,
        user_name: violation.user_name,
        chat_id: violation.chat_id,
        reason: `Критические нарушения: ${violation.violation_type}`,
        violation_type: violation.violation_type,
        created_at: new Date().toISOString(),
      };
    }

    if (action) {
      this.actions.push(action);
      this.saveData();
    }

    return action;
  }

  checkMessage(
    message: string,
    userId: string,
    userName: string,
    chatId: string
  ): ModerationResult {
    // Проверяем не забанен ли
    if (this.bannedUsers.has(userId)) {
      return {
        allowed: false,
        reason: "Пользователь забанен",
        action: "ban",
      };
    }

    // Проверяем не в муте ли
    if (this.mutedUsers.has(userId)) {
      const unmuteTime = this.mutedUsers.get(userId)!;
      if (new Date() < unmuteTime) {
        return {
          allowed: false,
          reason: `Пользователь в муте до ${unmuteTime.toLocaleString("ru-RU")}`,
          action: "mute",
          mute_until: unmuteTime.toISOString(),
        };
      } else {
        // Мут истек
        this.mutedUsers.delete(userId);
        this.saveData();
      }
    }

    // Анализируем сообщение
    const violation = this.analyzeMessage(message, userId, userName, chatId);

    if (violation) {
      this.addViolation(violation);
      const action = this.decideAction(violation);

      if (action) {
        if (action.action_type === "warning") {
          return {
            allowed: true,
            warning: true,
            message: `⚠️ Предупреждение: ${action.reason}`,
            action: "warning",
          };
        } else if (action.action_type.startsWith("mute_")) {
          const durationText = this.formatDuration(action.duration_minutes || 0);
          return {
            allowed: false,
            reason: `Вы получили мут на ${durationText}. Причина: ${action.reason}`,
            action: action.action_type,
            duration_minutes: action.duration_minutes,
          };
        } else if (action.action_type === "ban") {
          return {
            allowed: false,
            reason: `Вы забанены. Причина: ${action.reason}`,
            action: "ban",
          };
        }
      }
    }

    // Сообщение разрешено
    return {
      allowed: true,
      warning: false,
    };
  }

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

  getUserStatus(userId: string): UserModerationStatus {
    const isMuted = this.mutedUsers.has(userId) && new Date() < (this.mutedUsers.get(userId) || new Date());
    const muteUntil = isMuted ? this.mutedUsers.get(userId)?.toISOString() : null;

    return {
      is_muted: isMuted,
      is_banned: this.bannedUsers.has(userId),
      violations_count_24h: this.getUserViolationsCount(userId, 24),
      warnings_count: this.getUserWarningsCount(userId),
      mute_until: muteUntil || undefined,
    };
  }

  isUserMuted(userId: string): boolean {
    if (!this.mutedUsers.has(userId)) {
      return false;
    }

    const unmuteTime = this.mutedUsers.get(userId)!;
    if (new Date() > unmuteTime) {
      this.mutedUsers.delete(userId);
      this.saveData();
      return false;
    }

    return true;
  }

  isUserBanned(userId: string): boolean {
    return this.bannedUsers.has(userId);
  }
}

// Глобальный экземпляр
let moderationInstance: ChatModeration | null = null;

export function getChatModeration(): ChatModeration {
  if (!moderationInstance) {
    moderationInstance = new ChatModeration();
  }
  return moderationInstance;
}

