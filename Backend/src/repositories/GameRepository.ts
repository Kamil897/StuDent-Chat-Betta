import { prisma } from "../lib/prisma.js";

export class GameRepository {
  async getAllGames() {
    return prisma.game.findMany({
      orderBy: { id: "asc" },
    });
  }

  async getUnlockedGamesForUser(userId: string) {
    return prisma.gameUnlock.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
    });
  }

  async unlockGameForUser(userId: string, gameId: string) {
    const existing = await prisma.gameUnlock.findFirst({
      where: { userId, gameId },
    });
    if (existing) return existing;

    return prisma.gameUnlock.create({
      data: {
        userId,
        gameId,
      },
    });
  }
}



