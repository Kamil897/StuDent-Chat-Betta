import { GameRepository } from "../repositories/GameRepository.js";
import { PointsService } from "./PointsService.js";

export class GameService {
  private gameRepository = new GameRepository();
  private pointsService = new PointsService();

  async listGames() {
    return this.gameRepository.getAllGames();
  }

  async listUnlockedGames(userId: string) {
    return this.gameRepository.getUnlockedGamesForUser(userId);
  }

  async unlockGame(userId: string, gameId: string) {
    const games = await this.gameRepository.getAllGames();
    const game = games.find((g) => g.id === gameId);
    if (!game) {
      const err: any = new Error("Игра не найдена");
      err.statusCode = 404;
      throw err;
    }

    // списываем очки
    await this.pointsService.spendPoints(userId, game.unlockPrice, `unlock:${gameId}`);

    // разблокируем игру
    return this.gameRepository.unlockGameForUser(userId, gameId);
  }
}




