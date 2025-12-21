const STORAGE_KEY_POINTS = "user_points";
const STORAGE_KEY_TRANSACTIONS = "points_transactions";

export type PointsTransactionType = "game_win" | "achievement" | "shop_purchase" | "reward";

export interface PointsTransaction {
  id: number;
  type: PointsTransactionType;
  amount: number;
  source: string; // название игры, достижения и т.д.
  createdAt: string;
}

export interface PointsStats {
  totalEarned: number;
  totalSpent: number;
  gameWins: number;
  achievements: number;
}

/**
 * Get current points balance
 */
export function getPoints(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_POINTS);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Add points to balance
 */
export function addPoints(amount: number, type: PointsTransactionType, source: string): number {
  const current = getPoints();
  const newBalance = current + amount;

  // Save new balance
  localStorage.setItem(STORAGE_KEY_POINTS, newBalance.toString());

  // Save transaction
  const transaction: PointsTransaction = {
    id: Date.now(),
    type,
    amount,
    source,
    createdAt: new Date().toISOString(),
  };

  const transactions = getTransactions();
  transactions.unshift(transaction);
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));

  return newBalance;
}

/**
 * Spend points (for future shop purchases)
 */
export function spendPoints(amount: number, source: string): boolean {
  const current = getPoints();
  if (current < amount) {
    return false; // Not enough points
  }

  const newBalance = current - amount;
  localStorage.setItem(STORAGE_KEY_POINTS, newBalance.toString());

  // Save transaction
  const transaction: PointsTransaction = {
    id: Date.now(),
    type: "shop_purchase",
    amount: -amount,
    source,
    createdAt: new Date().toISOString(),
  };

  const transactions = getTransactions();
  transactions.unshift(transaction);
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));

  return true;
}

/**
 * Get all transactions
 */
export function getTransactions(): PointsTransaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get points statistics
 */
export function getPointsStats(): PointsStats {
  const transactions = getTransactions();
  
  let totalEarned = 0;
  let totalSpent = 0;
  let gameWins = 0;
  let achievements = 0;

  transactions.forEach((tx) => {
    if (tx.amount > 0) {
      totalEarned += tx.amount;
      if (tx.type === "game_win") gameWins++;
      if (tx.type === "achievement") achievements++;
    } else {
      totalSpent += Math.abs(tx.amount);
    }
  });

  return {
    totalEarned,
    totalSpent,
    gameWins,
    achievements,
  };
}

/**
 * Award points for game win (15 points)
 */
export function awardGameWin(gameName: string): number {
  return addPoints(15, "game_win", gameName);
}

/**
 * Award points for achievement (5 points)
 */
export function awardAchievement(achievementName: string): number {
  return addPoints(5, "achievement", achievementName);
}

/**
 * Check if user has enough points
 */
export function hasEnoughPoints(amount: number): boolean {
  return getPoints() >= amount;
}

