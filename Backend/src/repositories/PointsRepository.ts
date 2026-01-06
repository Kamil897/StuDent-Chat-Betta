import { prisma } from "../lib/prisma.js";
import type { PointsTransactionType } from "@prisma/client";

export class PointsRepository {
  async addTransaction(
    userId: string,
    type: PointsTransactionType,
    amount: number,
    source: string,
  ) {
    return prisma.pointsTransaction.create({
      data: {
        userId,
        type,
        amount,
        source,
      },
    });
  }

  async getUserTransactions(userId: string, limit = 50, offset = 0) {
    return prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });
  }

  async getUserStats(userId: string) {
    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId },
    });

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

  async getUserBalance(userId: string): Promise<number> {
    const result = await prisma.pointsTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }
}


