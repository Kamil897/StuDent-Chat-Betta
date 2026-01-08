/**
 * Game Records System
 * Manages high scores and records for all games
 */

export interface GameRecord {
  userId: string;
  username: string;
  name: string;
  email: string;
  gameId: string;
  gameName: string;
  score: number;
  recordType: 'score' | 'time' | 'wins' | 'streak';
  value: number;
  achievedAt: string;
  avatarSeed?: string;
}

const STORAGE_KEY_GAME_RECORDS = "game_records";

/**
 * Get all game records
 */
export function getAllGameRecords(): GameRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GAME_RECORDS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading game records:", e);
  }
  return [];
}

/**
 * Save game records
 */
function saveGameRecords(records: GameRecord[]): void {
  localStorage.setItem(STORAGE_KEY_GAME_RECORDS, JSON.stringify(records));
}

/**
 * Get current user info
 */
function getCurrentUserInfo(): { userId: string; username: string; name: string; email: string; avatarSeed?: string } {
  try {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return {
        userId: user.id || user.email || user.username || `user_${Date.now()}`,
        username: user.username || user.name || "User",
        name: user.name || `${user.name || ''} ${user.surname || ''}`.trim() || user.username || "User",
        email: user.email || "",
        avatarSeed: user.avatarSeed,
      };
    }
  } catch (e) {
    console.error("Error getting user info:", e);
  }
  return {
    userId: `user_${Date.now()}`,
    username: "Guest",
    name: "Guest",
    email: "",
  };
}

/**
 * Submit a game record
 */
export function submitGameRecord(
  gameId: string,
  gameName: string,
  recordType: 'score' | 'time' | 'wins' | 'streak',
  value: number
): boolean {
  try {
    const userInfo = getCurrentUserInfo();
    const records = getAllGameRecords();
    
    // Check if user already has a record for this game and type
    const existingIndex = records.findIndex(
      r => r.userId === userInfo.userId && r.gameId === gameId && r.recordType === recordType
    );
    
    const newRecord: GameRecord = {
      ...userInfo,
      gameId,
      gameName,
      score: value, // For backward compatibility
      recordType,
      value,
      achievedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      // Update if new value is better
      const existing = records[existingIndex];
      if (value > existing.value) {
        records[existingIndex] = newRecord;
        saveGameRecords(records);
        return true;
      }
      return false;
    } else {
      // Add new record
      records.push(newRecord);
      saveGameRecords(records);
      return true;
    }
  } catch (e) {
    console.error("Error submitting game record:", e);
    return false;
  }
}

/**
 * Get records for a specific game
 */
export function getGameRecords(gameId: string, recordType?: 'score' | 'time' | 'wins' | 'streak'): GameRecord[] {
  const allRecords = getAllGameRecords();
  let filtered = allRecords.filter(r => r.gameId === gameId);
  
  if (recordType) {
    filtered = filtered.filter(r => r.recordType === recordType);
  }
  
  // Sort by value descending
  return filtered.sort((a, b) => b.value - a.value);
}

/**
 * Get leaderboard for games tab
 */
export function getGameLeaderboard(gameId?: string): GameRecord[] {
  const allRecords = getAllGameRecords();
  
  if (gameId) {
    // Get top records for specific game
    const gameRecords = allRecords.filter(r => r.gameId === gameId);
    // Group by user and get their best record
    const userBestRecords = new Map<string, GameRecord>();
    
    gameRecords.forEach(record => {
      const existing = userBestRecords.get(record.userId);
      if (!existing || record.value > existing.value) {
        userBestRecords.set(record.userId, record);
      }
    });
    
    return Array.from(userBestRecords.values()).sort((a, b) => b.value - a.value);
  } else {
    // Get all records, grouped by user and game
    const userGameRecords = new Map<string, GameRecord>();
    
    allRecords.forEach(record => {
      const key = `${record.userId}_${record.gameId}`;
      const existing = userGameRecords.get(key);
      if (!existing || record.value > existing.value) {
        userGameRecords.set(key, record);
      }
    });
    
    return Array.from(userGameRecords.values()).sort((a, b) => b.value - a.value);
  }
}

/**
 * Get all available games with records
 */
export function getGamesWithRecords(): string[] {
  const records = getAllGameRecords();
  const gameIds = new Set(records.map(r => r.gameId));
  return Array.from(gameIds);
}

/**
 * Get game name mapping
 */
export function getGameName(gameId: string): string {
  const gameNames: Record<string, string> = {
    'Asteroid': 'Asteroids',
    'Pingpong': 'Ping Pong',
    'TicTacToe': 'TicTacToe',
    'MineSweeper': 'Minesweeper',
    'ArenaShooter': 'Arena Shooter',
    'TeleportingCubeGame': 'Teleporting Cube',
    'Tir': 'Tir',
    'Snake': 'Snake',
    'Chess': 'Chess',
    'Checkers': 'Checkers',
    'Don': 'Rock Paper Scissors',
  };
  
  return gameNames[gameId] || gameId;
}
