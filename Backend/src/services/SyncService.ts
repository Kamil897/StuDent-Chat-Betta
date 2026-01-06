import { SyncRepository } from "../repositories/SyncRepository";
import { SyncData, SyncPushResponse } from "../dtos/sync.dto";

/**
 * Сервис для синхронизации данных
 * Bridge между frontend localStorage и backend БД
 */
export class SyncService {
  private syncRepository: SyncRepository;

  constructor() {
    this.syncRepository = new SyncRepository();
  }

  /**
   * Push данные на сервер
   * Сохраняет все данные в БД (upsert)
   */
  async pushSyncData(userId: string, syncData: SyncData): Promise<SyncPushResponse> {
    try {
      // Сохраняем все коллекции параллельно для производительности
      await Promise.all([
        this.syncRepository.upsertChats(syncData.chats || []),
        this.syncRepository.upsertMessages(syncData.messages || []),
        this.syncRepository.upsertFriends(syncData.friends || []),
        this.syncRepository.upsertLeaderboard(syncData.leaderboard || []),
        this.syncRepository.upsertGames(syncData.games || []),
      ]);

      const serverTimestamp = Date.now();

      console.log(`[SyncService] Sync push completed for user ${userId}: ${syncData.chats?.length || 0} chats, ${syncData.messages?.length || 0} messages`);

      return {
        success: true,
        timestamp: serverTimestamp,
      };
    } catch (error: any) {
      console.error(`[SyncService] Sync push error for user ${userId}:`, error);
      throw new Error(`Ошибка синхронизации: ${error.message}`);
    }
  }

  /**
   * Pull данные с сервера
   * Возвращает все данные, обновлённые после since
   */
  async pullSyncData(userId: string, since: number = 0): Promise<SyncData> {
    try {
      // Получаем все обновлённые данные параллельно
      const [chats, messages, friends, leaderboard, games] = await Promise.all([
        this.syncRepository.getUpdatedChats(since),
        this.syncRepository.getUpdatedMessages(since),
        this.syncRepository.getUpdatedFriends(since),
        this.syncRepository.getUpdatedLeaderboard(since),
        this.syncRepository.getUpdatedGames(since),
      ]);

      const serverTimestamp = Date.now();

      console.log(`[SyncService] Sync pull completed for user ${userId} (since=${since}): ${chats.length} chats, ${messages.length} messages`);

      return {
        chats,
        messages,
        friends,
        leaderboard,
        games,
        timestamp: serverTimestamp,
      };
    } catch (error: any) {
      console.error(`[SyncService] Sync pull error for user ${userId}:`, error);
      throw new Error(`Ошибка получения данных: ${error.message}`);
    }
  }
}

