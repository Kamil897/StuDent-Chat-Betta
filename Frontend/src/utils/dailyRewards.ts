/**
 * Daily/Weekly Rewards System
 * Manages time-based free rewards
 */

const STORAGE_KEY_DAILY_REWARDS = "daily_rewards";
const STORAGE_KEY_WEEKLY_REWARDS = "weekly_rewards";

interface RewardRecord {
  lastClaimed: string; // ISO date string
  count: number;
}

/**
 * Check if daily reward (100 points) can be claimed
 */
export function canClaimDailyReward(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DAILY_REWARDS);
    if (!stored) return true;

    const record: RewardRecord = JSON.parse(stored);
    const lastClaimed = new Date(record.lastClaimed);
    const now = new Date();

    // Reset if it's a new day
    const isNewDay = 
      now.getDate() !== lastClaimed.getDate() ||
      now.getMonth() !== lastClaimed.getMonth() ||
      now.getFullYear() !== lastClaimed.getFullYear();

    return isNewDay;
  } catch {
    return true;
  }
}

/**
 * Claim daily reward (100 points)
 */
export function claimDailyReward(): { success: boolean; message: string } {
  if (!canClaimDailyReward()) {
    const stored = localStorage.getItem(STORAGE_KEY_DAILY_REWARDS);
    if (stored) {
      const record: RewardRecord = JSON.parse(stored);
      const lastClaimed = new Date(record.lastClaimed);
      const nextClaim = new Date(lastClaimed);
      nextClaim.setDate(nextClaim.getDate() + 1);
      nextClaim.setHours(0, 0, 0, 0);
      
      const hoursLeft = Math.ceil((nextClaim.getTime() - Date.now()) / (1000 * 60 * 60));
      return {
        success: false,
        message: `Вы уже получили награду сегодня. Следующая награда через ${hoursLeft} часов`
      };
    }
  }

  try {
    const record: RewardRecord = {
      lastClaimed: new Date().toISOString(),
      count: 1
    };
    localStorage.setItem(STORAGE_KEY_DAILY_REWARDS, JSON.stringify(record));
    return { success: true, message: "Ежедневная награда получена!" };
  } catch {
    return { success: false, message: "Ошибка при получении награды" };
  }
}

/**
 * Get time until next daily reward
 */
export function getTimeUntilDailyReward(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DAILY_REWARDS);
    if (!stored) return 0;

    const record: RewardRecord = JSON.parse(stored);
    const lastClaimed = new Date(record.lastClaimed);
    const nextClaim = new Date(lastClaimed);
    nextClaim.setDate(nextClaim.getDate() + 1);
    nextClaim.setHours(0, 0, 0, 0);

    const diff = nextClaim.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60))); // hours
  } catch {
    return 0;
  }
}

/**
 * Check if weekly reward (500 points) can be claimed
 */
export function canClaimWeeklyReward(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_WEEKLY_REWARDS);
    if (!stored) return true;

    const record: RewardRecord = JSON.parse(stored);
    const lastClaimed = new Date(record.lastClaimed);
    const now = new Date();

    // Check if 7 days have passed
    const daysDiff = Math.floor((now.getTime() - lastClaimed.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
  } catch {
    return true;
  }
}

/**
 * Claim weekly reward (500 points)
 */
export function claimWeeklyReward(): { success: boolean; message: string } {
  if (!canClaimWeeklyReward()) {
    const stored = localStorage.getItem(STORAGE_KEY_WEEKLY_REWARDS);
    if (stored) {
      const record: RewardRecord = JSON.parse(stored);
      const lastClaimed = new Date(record.lastClaimed);
      const nextClaim = new Date(lastClaimed);
      nextClaim.setDate(nextClaim.getDate() + 7);
      
      const daysLeft = Math.ceil((nextClaim.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        success: false,
        message: `Вы уже получили недельную награду. Следующая награда через ${daysLeft} дней`
      };
    }
  }

  try {
    const record: RewardRecord = {
      lastClaimed: new Date().toISOString(),
      count: 1
    };
    localStorage.setItem(STORAGE_KEY_WEEKLY_REWARDS, JSON.stringify(record));
    return { success: true, message: "Недельная награда получена!" };
  } catch {
    return { success: false, message: "Ошибка при получении награды" };
  }
}

/**
 * Get time until next weekly reward
 */
export function getTimeUntilWeeklyReward(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_WEEKLY_REWARDS);
    if (!stored) return 0;

    const record: RewardRecord = JSON.parse(stored);
    const lastClaimed = new Date(record.lastClaimed);
    const nextClaim = new Date(lastClaimed);
    nextClaim.setDate(nextClaim.getDate() + 7);

    const diff = nextClaim.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))); // days
  } catch {
    return 0;
  }
}


