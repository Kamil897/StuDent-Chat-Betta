import { AchievementRepository } from "../repositories/AchievementRepository.js";
import { PointsService } from "./PointsService.js";

export class AchievementService {
  private achievementRepository = new AchievementRepository();
  private pointsService = new PointsService();

  async getAllAchievements() {
    return this.achievementRepository.getAll();
  }

  async getUserAchievements(userId: string) {
    const { userAchievements, achievements } =
      await this.achievementRepository.getUserAchievements(userId);

    return userAchievements.map((ua) => {
      const a = achievements.find((x) => x.id === ua.achievementId);
      return {
        id: ua.id,
        achievementId: ua.achievementId,
        name: a?.name ?? ua.achievementId,
        description: a?.description ?? "",
        icon: a?.icon ?? "🏆",
        unlockedAt: ua.unlockedAt,
      };
    });
  }

  async unlockAchievement(userId: string, achievementId: string) {
    const ua = await this.achievementRepository.unlockForUser(
      userId,
      achievementId,
    );
    // Начисляем очки (по умолчанию 5)
    await this.pointsService.awardAchievement(userId, achievementId);
    return ua;
  }
}




