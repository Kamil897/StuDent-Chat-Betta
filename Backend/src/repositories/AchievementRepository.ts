import { prisma } from "../lib/prisma.js";

export class AchievementRepository {
  async getAll() {
    return prisma.achievement.findMany();
  }

  async getUserAchievements(userId: string) {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
    });
    const ids = userAchievements.map((ua) => ua.achievementId);
    const achievements = await prisma.achievement.findMany({
      where: { id: { in: ids } },
    });
    return { userAchievements, achievements };
  }

  async unlockForUser(userId: string, achievementId: string) {
    const existing = await prisma.userAchievement.findFirst({
      where: { userId, achievementId },
    });
    if (existing) return existing;

    return prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
      },
    });
  }
}




