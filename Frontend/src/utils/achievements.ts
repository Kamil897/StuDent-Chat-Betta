import { awardAchievement, getTransactions } from "./points";

const STORAGE_KEY_ACHIEVEMENTS = "user_achievements";

export type AchievementId =
  | "first_game_win"
  | "first_achievement"
  | "asteroids_master"
  | "pingpong_master"
  | "tictactoe_master"
  | "minesweeper_master"
  | "snake_master"
  | "tir_master"
  | "arena_master"
  | "cube_master"
  | "chess_master"
  | "checkers_master"
  | "10_games_won"
  | "50_games_won"
  | "100_games_won"
  | "250_games_won"
  | "500_games_won";

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

const ALL_ACHIEVEMENTS: Record<AchievementId, Omit<Achievement, "unlockedAt">> = {
  first_game_win: {
    id: "first_game_win",
    name: "Первая победа",
    description: "Выиграйте свою первую игру",
    icon: "🎯",
  },
  first_achievement: {
    id: "first_achievement",
    name: "Первое достижение",
    description: "Получите первое достижение",
    icon: "🌟",
  },
  asteroids_master: {
    id: "asteroids_master",
    name: "Мастер Астероидов",
    description: "Выиграйте 5 раз в Asteroids",
    icon: "☄️",
  },
  pingpong_master: {
    id: "pingpong_master",
    name: "Мастер Пинг-Понга",
    description: "Выиграйте 5 раз в Ping Pong",
    icon: "🏓",
  },
  tictactoe_master: {
    id: "tictactoe_master",
    name: "Мастер Крестиков-Ноликов",
    description: "Выиграйте 5 раз в TicTacToe",
    icon: "⭕",
  },
  minesweeper_master: {
    id: "minesweeper_master",
    name: "Мастер Сапёра",
    description: "Выиграйте 5 раз в Minesweeper",
    icon: "💣",
  },
  "10_games_won": {
    id: "10_games_won",
    name: "Десять побед",
    description: "Выиграйте 10 игр",
    icon: "🔟",
  },
  "50_games_won": {
    id: "50_games_won",
    name: "Пятьдесят побед",
    description: "Выиграйте 50 игр",
    icon: "💯",
  },
  "100_games_won": {
    id: "100_games_won",
    name: "Сто побед",
    description: "Выиграйте 100 игр",
    icon: "🏆",
  },
  "250_games_won": {
    id: "250_games_won",
    name: "Двести пятьдесят побед",
    description: "Выиграйте 250 игр",
    icon: "👑",
  },
  "500_games_won": {
    id: "500_games_won",
    name: "Пятьсот побед",
    description: "Выиграйте 500 игр",
    icon: "💎",
  },
  snake_master: {
    id: "snake_master",
    name: "Мастер Змейки",
    description: "Выиграйте 5 раз в Snake",
    icon: "🐍",
  },
  tir_master: {
    id: "tir_master",
    name: "Мастер Тира",
    description: "Выиграйте 5 раз в Tir",
    icon: "🎯",
  },
  arena_master: {
    id: "arena_master",
    name: "Мастер Арены",
    description: "Выиграйте 5 раз в Arena Shooter",
    icon: "🔫",
  },
  cube_master: {
    id: "cube_master",
    name: "Мастер Куба",
    description: "Выиграйте 5 раз в Teleporting Cube",
    icon: "🎲",
  },
  chess_master: {
    id: "chess_master",
    name: "Мастер Шахмат",
    description: "Выиграйте 5 раз в Chess",
    icon: "♟️",
  },
  checkers_master: {
    id: "checkers_master",
    name: "Мастер Шашек",
    description: "Выиграйте 5 раз в Checkers",
    icon: "⚫",
  },
};

/**
 * Get all unlocked achievements
 */
export function getUnlockedAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
    if (!stored) return [];

    const unlockedIds: AchievementId[] = JSON.parse(stored);
    return unlockedIds.map((id) => ({
      ...ALL_ACHIEVEMENTS[id],
      unlockedAt: localStorage.getItem(`achievement_${id}_unlocked_at`) || undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Check if achievement is unlocked
 */
export function isAchievementUnlocked(id: AchievementId): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
    if (!stored) return false;

    const unlockedIds: AchievementId[] = JSON.parse(stored);
    return unlockedIds.includes(id);
  } catch {
    return false;
  }
}

/**
 * Unlock an achievement
 */
export function unlockAchievement(id: AchievementId): boolean {
  if (isAchievementUnlocked(id)) {
    return false; // Already unlocked
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
    const unlockedIds: AchievementId[] = stored ? JSON.parse(stored) : [];

    unlockedIds.push(id);
    localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(unlockedIds));
    localStorage.setItem(`achievement_${id}_unlocked_at`, new Date().toISOString());

    // Award points for achievement
    const achievement = ALL_ACHIEVEMENTS[id];
    awardAchievement(achievement.name);

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent("achievement-unlocked", { detail: { id, achievement } }));
    
    // Add notification (async import without blocking)
    import("./notifications").then(({ notifyAchievement }) => {
      notifyAchievement(achievement.name, achievement.description);
    }).catch((error) => {
      console.error("Error loading notifications module:", error);
    });

    return true;
  } catch (error) {
    console.error("Error unlocking achievement:", error);
    return false;
  }
}

/**
 * Get all achievements (locked and unlocked)
 */
export function getAllAchievements(): Achievement[] {
  const unlocked = getUnlockedAchievements();
  const unlockedIds = new Set(unlocked.map((a) => a.id));

  return Object.values(ALL_ACHIEVEMENTS).map((achievement) => {
    if (unlockedIds.has(achievement.id)) {
      return unlocked.find((a) => a.id === achievement.id)!;
    }
    return { ...achievement, unlockedAt: undefined };
  });
}

/**
 * Check and unlock game-related achievements
 */
export function checkGameAchievements(gameName: string, totalWins: number) {
  // First game win
  if (totalWins === 1) {
    unlockAchievement("first_game_win");
  }

  // Game-specific achievements
  if (gameName.toLowerCase().includes("asteroid")) {
    const gameWins = getGameWins("asteroids");
    if (gameWins >= 5) {
      unlockAchievement("asteroids_master");
    }
  } else if (gameName.toLowerCase().includes("ping") || gameName.toLowerCase().includes("pong")) {
    const gameWins = getGameWins("pingpong");
    if (gameWins >= 5) {
      unlockAchievement("pingpong_master");
    }
  } else if (
    gameName.toLowerCase().includes("tic") ||
    gameName.toLowerCase().includes("tac") ||
    gameName.toLowerCase().includes("don") ||
    gameName.toLowerCase().includes("rock paper")
  ) {
    const gameWins = getGameWins("tictactoe");
    if (gameWins >= 5) {
      unlockAchievement("tictactoe_master");
    }
  } else if (
    gameName.toLowerCase().includes("mine") ||
    gameName.toLowerCase().includes("sweeper")
  ) {
    const gameWins = getGameWins("minesweeper");
    if (gameWins >= 5) {
      unlockAchievement("minesweeper_master");
    }
  } else if (gameName.toLowerCase().includes("snake")) {
    const gameWins = getGameWins("snake");
    if (gameWins >= 5) {
      unlockAchievement("snake_master");
    }
  } else if (gameName.toLowerCase().includes("tir")) {
    const gameWins = getGameWins("tir");
    if (gameWins >= 5) {
      unlockAchievement("tir_master");
    }
  } else if (gameName.toLowerCase().includes("arena")) {
    const gameWins = getGameWins("arena");
    if (gameWins >= 5) {
      unlockAchievement("arena_master");
    }
  } else if (gameName.toLowerCase().includes("cube") || gameName.toLowerCase().includes("teleporting")) {
    const gameWins = getGameWins("cube");
    if (gameWins >= 5) {
      unlockAchievement("cube_master");
    }
  } else if (gameName.toLowerCase().includes("chess")) {
    const gameWins = getGameWins("chess");
    if (gameWins >= 5) {
      unlockAchievement("chess_master");
    }
  } else if (gameName.toLowerCase().includes("checker")) {
    const gameWins = getGameWins("checkers");
    if (gameWins >= 5) {
      unlockAchievement("checkers_master");
    }
  }

  // Total wins achievements
  if (totalWins === 10) {
    unlockAchievement("10_games_won");
  } else if (totalWins === 50) {
    unlockAchievement("50_games_won");
  } else if (totalWins === 100) {
    unlockAchievement("100_games_won");
  } else if (totalWins === 250) {
    unlockAchievement("250_games_won");
  } else if (totalWins === 500) {
    unlockAchievement("500_games_won");
  }
}

/**
 * Get wins count for specific game
 */
function getGameWins(gameId: string): number {
  try {
    const transactions = getTransactions();
    return transactions.filter(
      (t) => t.type === "game_win" && t.source.toLowerCase().includes(gameId)
    ).length;
  } catch {
    return 0;
  }
}

