/**
 * API Synchronization System
 * Синхронизация данных между клиентами через API
 * Работает как бэкенд, но пока на фронте (localStorage + HTTP синхронизация)
 */

// Конфигурация API (можно настроить через переменные окружения)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const SYNC_INTERVAL = 5000; // Синхронизация каждые 5 секунд
const ENABLE_SYNC = import.meta.env.VITE_ENABLE_SYNC !== "false"; // По умолчанию включено

export interface SyncData {
  chats: any[];
  messages: any[];
  friends: any[];
  leaderboard: any[];
  games: any[];
  timestamp: number;
}

class ApiSync {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing: boolean = false;
  private lastSyncTime: number = 0;

  /**
   * Начать синхронизацию
   */
  startSync(): void {
    if (!ENABLE_SYNC) {
      console.log("🔄 API синхронизация отключена");
      return;
    }

    if (this.syncInterval) {
      return; // Уже запущена
    }

    console.log("🔄 API синхронизация запущена");
    
    // Немедленная синхронизация
    this.sync();

    // Периодическая синхронизация
    this.syncInterval = setInterval(() => {
      this.sync();
    }, SYNC_INTERVAL);
  }

  /**
   * Остановить синхронизацию
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("🔄 API синхронизация остановлена");
    }
  }

  /**
   * Синхронизировать данные с сервером
   */
  private async sync(): Promise<void> {
    if (this.isSyncing) {
      return; // Уже синхронизируется
    }

    this.isSyncing = true;

    try {
      // Получаем локальные данные
      const localData = this.getLocalData();

      // Отправляем на сервер (не ждем ответа, чтобы не блокировать)
      this.pushToServer(localData).catch(() => {
        // Игнорируем ошибки отправки, работаем в офлайн режиме
      });

      // Получаем данные с сервера
      const serverData = await this.pullFromServer();

      // Объединяем данные
      if (serverData) {
        this.mergeData(serverData, localData);
      }

      this.lastSyncTime = Date.now();
    } catch (error) {
      // Игнорируем ошибки, работаем в офлайн режиме
      // Ошибки игнорируются, работаем в офлайн режиме
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Получить локальные данные
   */
  private getLocalData(): SyncData {
    return {
      chats: JSON.parse(localStorage.getItem("chatRooms") || "[]"),
      messages: JSON.parse(localStorage.getItem("chatMessages") || "[]"),
      friends: JSON.parse(localStorage.getItem("friends") || "[]"),
      leaderboard: JSON.parse(localStorage.getItem("leaderboard") || "[]"),
      games: JSON.parse(localStorage.getItem("games") || "[]"),
      timestamp: Date.now(),
    };
  }

  /**
   * Отправить данные на сервер
   */
  private async pushToServer(data: SyncData): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/sync/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error: any) {
      // Если сервер недоступен или таймаут, работаем в офлайн режиме
      if (error.name !== "AbortError") {
        // Не логируем ошибки сети, чтобы не засорять консоль
      }
      throw error;
    }
  }

  /**
   * Получить данные с сервера
   */
  private async pullFromServer(): Promise<SyncData | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Таймаут 3 секунды

      const response = await fetch(`${API_BASE_URL}/sync/pull?since=${this.lastSyncTime}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      // Если сервер недоступен или таймаут, возвращаем null
      if (error.name !== "AbortError") {
        // Не логируем ошибки сети
      }
      return null;
    }
  }

  /**
   * Объединить данные с сервера и локальные
   */
  private mergeData(serverData: SyncData, localData: SyncData): void {
    // Объединяем чаты (приоритет у более новых)
    const mergedChats = this.mergeArrays(serverData.chats, localData.chats, "id", "createdAt");
    localStorage.setItem("chatRooms", JSON.stringify(mergedChats));

    // Объединяем сообщения
    const mergedMessages = this.mergeArrays(serverData.messages, localData.messages, "id", "createdAt");
    localStorage.setItem("chatMessages", JSON.stringify(mergedMessages));

    // Объединяем друзей
    const mergedFriends = this.mergeArrays(serverData.friends, localData.friends, "id", "createdAt");
    localStorage.setItem("friends", JSON.stringify(mergedFriends));

    // Объединяем лидерборд
    const mergedLeaderboard = this.mergeArrays(serverData.leaderboard, localData.leaderboard, "id", "updatedAt");
    localStorage.setItem("leaderboard", JSON.stringify(mergedLeaderboard));

    // Объединяем игры
    const mergedGames = this.mergeArrays(serverData.games, localData.games, "id", "createdAt");
    localStorage.setItem("games", JSON.stringify(mergedGames));

    // Уведомляем о синхронизации
    window.dispatchEvent(new CustomEvent("dataSynced", { detail: mergedChats }));
  }

  /**
   * Объединить два массива, приоритет у более новых элементов
   */
  private mergeArrays<T extends { [key: string]: any }>(
    server: T[],
    local: T[],
    idKey: string,
    timeKey: string
  ): T[] {
    const merged = new Map<string, T>();

    // Добавляем локальные данные
    local.forEach((item) => {
      merged.set(item[idKey], item);
    });

    // Добавляем/обновляем данными с сервера (если они новее)
    server.forEach((item) => {
      const existing = merged.get(item[idKey]);
      if (!existing || new Date(item[timeKey]) > new Date(existing[timeKey])) {
        merged.set(item[idKey], item);
      }
    });

    return Array.from(merged.values());
  }

  /**
   * Принудительная синхронизация
   */
  async forceSync(): Promise<void> {
    await this.sync();
  }
}

// Глобальный экземпляр
let apiSyncInstance: ApiSync | null = null;

export function getApiSync(): ApiSync {
  if (!apiSyncInstance) {
    apiSyncInstance = new ApiSync();
  }
  return apiSyncInstance;
}

export function startApiSync(): void {
  const sync = getApiSync();
  sync.startSync();
}

export function stopApiSync(): void {
  const sync = getApiSync();
  sync.stopSync();
}

export function forceSync(): Promise<void> {
  const sync = getApiSync();
  return sync.forceSync();
}

