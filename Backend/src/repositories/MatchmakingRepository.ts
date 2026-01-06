import { prisma } from "../lib/prisma.js";

const client = prisma as any;

export class MatchmakingRepository {
  async enqueue(userId: string, gameId: string) {
    // помечаем старые очереди как cancelled
    await client.matchQueue.updateMany({
      where: { userId, status: "searching" },
      data: { status: "cancelled" },
    });

    return client.matchQueue.create({
      data: {
        userId,
        gameId,
        status: "searching",
      },
    });
  }

  async findOpponent(userId: string, gameId: string) {
    return client.matchQueue.findFirst({
      where: {
        gameId,
        status: "searching",
        userId: { not: userId },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async createMatch(gameId: string, player1Id: string, player2Id: string) {
    return client.match.create({
      data: {
        gameId,
        player1Id,
        player2Id,
        status: "pending",
      },
    });
  }

  async markQueuesMatched(
    userId1: string,
    userId2: string,
    gameId: string,
  ) {
    await client.matchQueue.updateMany({
      where: {
        gameId,
        userId: { in: [userId1, userId2] },
        status: "searching",
      },
      data: { status: "matched" },
    });
  }

  async cancelQueue(userId: string) {
    await client.matchQueue.updateMany({
      where: { userId, status: "searching" },
      data: { status: "cancelled" },
    });
  }

  async getActiveMatchForUser(userId: string) {
    return client.match.findFirst({
      where: {
        status: { in: ["pending", "active"] },
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getQueueForUser(userId: string, gameId: string) {
    return client.matchQueue.findFirst({
      where: {
        userId,
        gameId,
        status: "searching",
      },
    });
  }
}



