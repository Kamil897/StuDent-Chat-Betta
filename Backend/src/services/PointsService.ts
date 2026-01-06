import type { PointsTransactionType } from "@prisma/client";
import { PointsRepository } from "../repositories/PointsRepository.js";
import { LeaderboardRepository } from "../repositories/LeaderboardRepository.js";
import { notifyLeaderboardUpdate } from "../utils/leaderboardEmitter.js";

export class PointsService {
  private pointsRepository = new PointsRepository();
  private leaderboardRepository = new LeaderboardRepository();

  async getWallet(userId: string) {
    const [balance, stats] = await Promise.all([
      this.pointsRepository.getUserBalance(userId),
      this.pointsRepository.getUserStats(userId),
    ]);

    return {
      balance,
      stats,
    };
  }

  async getTransactions(userId: string, page = 1, pageSize = 50) {
    const offset = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.pointsRepository.getUserTransactions(userId, pageSize, offset),
      this.pointsRepository.getUserTransactions(userId, 1000000, 0).then((all) => all.length),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
    };
  }

  private async addPointsInternal(
    userId: string,
    amount: number,
    type: PointsTransactionType,
    source: string,
  ) {
    await this.pointsRepository.addTransaction(userId, type, amount, source);
    const balance = await this.pointsRepository.getUserBalance(userId);
    await this.leaderboardRepository.upsertUserPoints(userId, balance);
    // Уведомляем об обновлении лидерборда для real-time обновлений
    notifyLeaderboardUpdate();
    return balance;
  }

  async awardGameWin(userId: string, gameName: string, amount = 15) {
    return this.addPointsInternal(userId, amount, "game_win", gameName);
  }

  async awardAchievement(userId: string, achievementName: string, amount = 5) {
    return this.addPointsInternal(userId, amount, "achievement", achievementName);
  }

  async addReward(userId: string, amount: number, source: string) {
    return this.addPointsInternal(userId, amount, "reward", source);
  }

  async spendPoints(userId: string, amount: number, source: string) {
    const balance = await this.pointsRepository.getUserBalance(userId);
    if (balance < amount) {
      const err: any = new Error("Недостаточно очков");
      err.statusCode = 400;
      throw err;
    }
    return this.addPointsInternal(userId, -amount, "shop_purchase", source);
  }
}



