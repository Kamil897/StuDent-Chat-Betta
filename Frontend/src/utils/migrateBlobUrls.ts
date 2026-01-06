/**
 * Миграция старых blob URL в сообщениях
 * Очищает недействительные blob URL из localStorage
 */

const STORAGE_KEY_MESSAGES = "chatMessages";

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

/**
 * Мигрировать все сообщения, удалив недействительные blob URL
 */
export function migrateAllMessages(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!stored) {
      return 0;
    }

    const allMessages: Message[] = JSON.parse(stored);
    let migratedCount = 0;

    const migratedMessages = allMessages.map((msg) => {
      // Если это файл или голосовое сообщение с blob URL
      if ((msg.type === "file" || msg.type === "voice") && msg.fileUrl) {
        // Проверяем, является ли это blob URL
        if (msg.fileUrl.startsWith("blob:")) {
          migratedCount++;
          // Удаляем недействительный blob URL
          return {
            ...msg,
            fileUrl: undefined,
            text: msg.type === "file" 
              ? `📎 ${msg.fileName || "Файл"} (файл недоступен - старая версия)` 
              : "🎤 Голосовое сообщение (недоступно - старая версия)",
          };
        }
      }
      return msg;
    });

    // Сохраняем обновленные сообщения
    if (migratedCount > 0) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(migratedMessages));
      console.log(`✅ Мигрировано ${migratedCount} сообщений с недействительными blob URL`);
    }

    return migratedCount;
  } catch (e) {
    console.error("Ошибка при миграции сообщений:", e);
    return 0;
  }
}

/**
 * Запустить миграцию при загрузке приложения
 */
export function runMigrationOnLoad(): void {
  // Запускаем миграцию только один раз
  const migrationKey = "blob_url_migration_completed";
  const migrationCompleted = localStorage.getItem(migrationKey);
  
  if (!migrationCompleted) {
    const count = migrateAllMessages();
    if (count > 0) {
      localStorage.setItem(migrationKey, "true");
    }
  }
}







