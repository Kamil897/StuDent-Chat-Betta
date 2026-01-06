import { LeaderboardRepository } from "../repositories/LeaderboardRepository.js";

export class LeaderboardService {
  private leaderboardRepository: LeaderboardRepository;

  constructor() {
    this.leaderboardRepository = new LeaderboardRepository();
  }

  async getTop(limit = 50, offset = 0) {
    const entries = await this.leaderboardRepository.getTop(limit, offset);
    
    return entries.map((entry: any) => ({
      id: entry.user.id,
      username: entry.user.username,
      name: `${entry.user.name} ${entry.user.surname || ""}`.trim() || entry.user.username,
      email: entry.user.email,
      points: entry.points,
      avatarSeed: entry.user.avatarSeed,
      rank: offset + entries.indexOf(entry) + 1,
    }));
  }

  async getUserRank(userId: string) {
    const allEntries = await this.leaderboardRepository.getTop(10000, 0);
    const userIndex = allEntries.findIndex((entry: any) => entry.userId === userId);
    return userIndex >= 0 ? userIndex + 1 : null;
  }

  async updateUserPoints(userId: string, points: number) {
    return await this.leaderboardRepository.upsertUserPoints(userId, points);
  }
}

