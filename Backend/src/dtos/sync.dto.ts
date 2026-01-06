/**
 * DTO для синхронизации данных
 * Полная совместимость с фронтендом - НЕ МЕНЯТЬ структуру!
 */
export interface SyncData {
  chats: any[];
  messages: any[];
  friends: any[];
  leaderboard: any[];
  games: any[];
  timestamp: number;
}

/**
 * DTO для ответа push
 */
export interface SyncPushResponse {
  success: boolean;
  timestamp: number;
}


