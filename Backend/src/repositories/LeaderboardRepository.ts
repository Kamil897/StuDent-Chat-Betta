import { prisma } from "../lib/prisma.js";

export class LeaderboardRepository {
  async upsertUserPoints(userId: string, points: number) {
    return prisma.leaderboardEntry.upsert({
      where: { userId },
      create: {
        userId,
        points,
      },
      update: {
        points,
      },
    });
  }

  async getTop(limit = 50, offset = 0) {
    return prisma.leaderboardEntry.findMany({
      orderBy: { points: "desc" },
      skip: offset,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            username: true,
            email: true,
            avatarSeed: true,
          },
        },
      },
    });
  }
}




