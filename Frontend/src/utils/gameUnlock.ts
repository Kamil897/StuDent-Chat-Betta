/**
 * Game Unlock System
 * Manages locked/unlocked games and lottery system
 */

const STORAGE_KEY_UNLOCKED_GAMES = "unlocked_games";
const STORAGE_KEY_LOCKED_GAMES = "locked_games";

export interface GameUnlockInfo {
  gameId: string;
  unlockPrice: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

/**
 * Get all unlocked games
 */
export function getUnlockedGames(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_UNLOCKED_GAMES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Check if game is unlocked
 */
export function isGameUnlocked(gameId: string): boolean {
  const unlocked = getUnlockedGames();
  return unlocked.includes(gameId);
}

/**
 * Unlock a game
 */
export function unlockGame(gameId: string): boolean {
  if (isGameUnlocked(gameId)) {
    return false; // Already unlocked
  }

  try {
    const unlocked = getUnlockedGames();
    unlocked.push(gameId);
    localStorage.setItem(STORAGE_KEY_UNLOCKED_GAMES, JSON.stringify(unlocked));
    localStorage.setItem(`game_${gameId}_unlocked_at`, new Date().toISOString());
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent("game-unlocked", { detail: { gameId } }));
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Get locked games list
 */
export function getLockedGames(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LOCKED_GAMES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Set locked games (for initial setup)
 */
export function setLockedGames(gameIds: string[]): void {
  localStorage.setItem(STORAGE_KEY_LOCKED_GAMES, JSON.stringify(gameIds));
}

/**
 * Get current lottery price (increases by 50 after each purchase)
 */
export function getLotteryPrice(): number {
  try {
    const stored = localStorage.getItem("lottery_price");
    return stored ? parseInt(stored, 10) : 75; // Start at 75
  } catch {
    return 75;
  }
}

/**
 * Increase lottery price by 50
 */
export function increaseLotteryPrice(): number {
  const current = getLotteryPrice();
  const newPrice = current + 50;
  localStorage.setItem("lottery_price", newPrice.toString());
  
  // Track purchase count
  const count = parseInt(localStorage.getItem("lottery_purchase_count") || "0", 10);
  localStorage.setItem("lottery_purchase_count", String(count + 1));
  
  return newPrice;
}

/**
 * Check if lottery can be purchased today
 */
export function canPurchaseLotteryToday(): boolean {
  try {
    const stored = localStorage.getItem("lottery_last_purchase");
    if (!stored) return true;

    const lastPurchase = new Date(stored);
    const now = new Date();

    // Reset if it's a new day
    const isNewDay = 
      now.getDate() !== lastPurchase.getDate() ||
      now.getMonth() !== lastPurchase.getMonth() ||
      now.getFullYear() !== lastPurchase.getFullYear();

    return isNewDay;
  } catch {
    return true;
  }
}

/**
 * Get time until next lottery purchase
 */
export function getTimeUntilLotteryPurchase(): number {
  try {
    const stored = localStorage.getItem("lottery_last_purchase");
    if (!stored) return 0;

    const lastPurchase = new Date(stored);
    const nextPurchase = new Date(lastPurchase);
    nextPurchase.setDate(nextPurchase.getDate() + 1);
    nextPurchase.setHours(0, 0, 0, 0);

    const diff = nextPurchase.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60))); // hours
  } catch {
    return 0;
  }
}

/**
 * Record lottery purchase
 */
export function recordLotteryPurchase(): void {
  localStorage.setItem("lottery_last_purchase", new Date().toISOString());
}

/**
 * Lottery system - randomly unlock a game
 */
export function lotteryUnlockGame(): { success: boolean; gameId?: string; message: string } {
  const locked = getLockedGames();
  const unlocked = getUnlockedGames();
  
  // Filter out already unlocked games
  const availableToUnlock = locked.filter(id => !unlocked.includes(id));
  
  if (availableToUnlock.length === 0) {
    return {
      success: false,
      message: "Все игры уже разблокированы!"
    };
  }
  
  // Randomly select a game
  const randomIndex = Math.floor(Math.random() * availableToUnlock.length);
  const gameId = availableToUnlock[randomIndex];
  
  // Unlock the game
  if (unlockGame(gameId)) {
    // Increase price for next purchase
    increaseLotteryPrice();
    // Record purchase time
    recordLotteryPurchase();
    
    return {
      success: true,
      gameId,
      message: `🎉 Поздравляем! Игра "${gameId}" разблокирована!`
    };
  }
  
  return {
    success: false,
    message: "Ошибка при разблокировке игры"
  };
}

/**
 * Get game unlock price
 */
export function getGameUnlockPrice(gameId: string): number {
  const prices: Record<string, number> = {
    'Asteroid': 50,
    'Pingpong': 50,
    'TicTacToe': 30,
    'MineSweeper': 75,
    'ArenaShooter': 100,
    'TeleportingCubeGame': 60,
    'Tir': 40,
    'Snake': 45,
  };
  
  return prices[gameId] || 50;
}

