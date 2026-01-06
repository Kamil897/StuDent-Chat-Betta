import { MatchmakingRepository } from "../repositories/MatchmakingRepository.js";

export class MatchmakingService {
  private repo = new MatchmakingRepository();

  async queue(userId: string, gameId: string) {
    // Проверяем, есть ли уже активный матч для этого пользователя
    const existingMatch = await this.repo.getActiveMatchForUser(userId);
    if (existingMatch) {
      const opponentId = existingMatch.player1Id === userId ? existingMatch.player2Id : existingMatch.player1Id;
      return {
        searching: false as const,
        matchId: existingMatch.id as string,
        opponentId: opponentId as string,
      };
    }

    // Проверяем, есть ли уже запись в очереди для этого пользователя
    const existingQueue = await (this.repo as any).getQueueForUser(userId, gameId);
    
    if (!existingQueue) {
      // Встаём в очередь только если её нет
      await this.repo.enqueue(userId, gameId);
    }

    // Пытаемся найти оппонента
    const opponentQueue = await this.repo.findOpponent(userId, gameId);

    if (!opponentQueue) {
      return { searching: true as const };
    }

    // Нашли оппонента - создаем матч
    const match = await this.repo.createMatch(
      gameId,
      opponentQueue.userId,
      userId,
    );
    await this.repo.markQueuesMatched(userId, opponentQueue.userId, gameId);

    return {
      searching: false as const,
      matchId: match.id as string,
      opponentId: opponentQueue.userId as string,
    };
  }

  async cancel(userId: string) {
    await this.repo.cancelQueue(userId);
  }

  async status(userId: string) {
    const match = await this.repo.getActiveMatchForUser(userId);
    if (!match) {
      return { searching: true as const };
    }

    const opponentId =
      match.player1Id === userId ? match.player2Id : match.player1Id;

    return {
      searching: false as const,
      matchId: match.id as string,
      gameId: match.gameId as string,
      opponentId: opponentId as string,
      status: match.status as string,
    };
  }
}



