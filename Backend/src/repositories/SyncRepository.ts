import { prisma } from "../lib/prisma";

/**
 * Репозиторий для синхронизации данных
 * Bridge между frontend localStorage и backend БД
 * Сохраняет данные в том же формате, что приходит с фронта
 */
export class SyncRepository {
  /**
   * Upsert чатов (ChatRoom)
   * Сохраняет полный объект как есть
   */
  async upsertChats(chats: any[]): Promise<void> {
    for (const chat of chats) {
      if (!chat.id) continue;

      await prisma.chatRoom.upsert({
        where: { id: chat.id },
        create: {
          id: chat.id,
          name: chat.name || "",
          type: chat.type || "channel",
          category: chat.category || null,
          description: chat.description || null,
          icon: chat.icon || null,
          createdAt: chat.createdAt ? new Date(chat.createdAt) : new Date(),
          updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : new Date(),
        },
        update: {
          name: chat.name || "",
          type: chat.type || "channel",
          category: chat.category || null,
          description: chat.description || null,
          icon: chat.icon || null,
          updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : new Date(),
        },
      });
    }
  }

  /**
   * Upsert сообщений (Message)
   */
  async upsertMessages(messages: any[]): Promise<void> {
    for (const msg of messages) {
      if (!msg.id || !msg.chatId) continue;

      await prisma.message.upsert({
        where: { id: msg.id },
        create: {
          id: msg.id,
          chatId: msg.chatId,
          userId: msg.userId || null,
          username: msg.username || null,
          text: msg.text || "",
          type: msg.type || "text",
          fileUrl: msg.fileUrl || null,
          fileName: msg.fileName || null,
          fileType: msg.fileType || null,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          updatedAt: msg.updatedAt ? new Date(msg.updatedAt) : new Date(),
        },
        update: {
          userId: msg.userId || null,
          username: msg.username || null,
          text: msg.text || "",
          type: msg.type || "text",
          fileUrl: msg.fileUrl || null,
          fileName: msg.fileName || null,
          fileType: msg.fileType || null,
          updatedAt: msg.updatedAt ? new Date(msg.updatedAt) : new Date(),
        },
      });
    }
  }

  /**
   * Upsert друзей (Friend)
   */
  async upsertFriends(friends: any[]): Promise<void> {
    for (const friend of friends) {
      if (!friend.id || !friend.userId) continue;

      await prisma.friend.upsert({
        where: { id: friend.id },
        create: {
          id: friend.id,
          userId: friend.userId,
          friendId: friend.friendId || friend.id,
          name: friend.name || "",
          email: friend.email || null,
          avatar: friend.avatar || null,
          createdAt: friend.createdAt ? new Date(friend.createdAt) : new Date(),
        },
        update: {
          userId: friend.userId,
          friendId: friend.friendId || friend.id,
          name: friend.name || "",
          email: friend.email || null,
          avatar: friend.avatar || null,
        },
      });
    }
  }

  /**
   * Upsert лидерборда (LeaderboardEntry)
   */
  async upsertLeaderboard(leaderboard: any[]): Promise<void> {
    for (const entry of leaderboard) {
      if (!entry.id || !entry.userId) continue;

      await prisma.leaderboardEntry.upsert({
        where: { id: entry.id },
        create: {
          id: entry.id,
          userId: entry.userId,
          points: entry.points || 0,
          createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
        },
        update: {
          points: entry.points || 0,
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
        },
      });
    }
  }

  /**
   * Upsert игр (Game и GameUnlock)
   */
  async upsertGames(games: any[]): Promise<void> {
    for (const game of games) {
      if (!game.id) continue;

      // Сохраняем Game если есть displayName
      if (game.displayName) {
        await prisma.game.upsert({
          where: { id: game.id },
          create: {
            id: game.id,
            displayName: game.displayName,
            unlockPrice: game.unlockPrice || 0,
          },
          update: {
            displayName: game.displayName,
            unlockPrice: game.unlockPrice || 0,
          },
        });
      }

      // Если есть userId, сохраняем GameUnlock
      if (game.userId) {
        const unlockId = game.id.includes("_") ? game.id : `${game.id}_${game.userId}`;
        
        // Проверяем существование перед созданием
        const existing = await prisma.gameUnlock.findUnique({
          where: { id: unlockId },
        });

        if (existing) {
          await prisma.gameUnlock.update({
            where: { id: unlockId },
            data: {
              unlockedAt: game.unlockedAt ? new Date(game.unlockedAt) : new Date(),
            },
          });
        } else {
          await prisma.gameUnlock.create({
            data: {
              id: unlockId,
              userId: game.userId,
              gameId: game.id,
              unlockedAt: game.unlockedAt ? new Date(game.unlockedAt) : new Date(),
            },
          });
        }
      }
    }
  }

  /**
   * Получить обновлённые чаты после since
   */
  async getUpdatedChats(since: number): Promise<any[]> {
    const sinceDate = new Date(since);
    const chats = await prisma.chatRoom.findMany({
      where: {
        updatedAt: {
          gt: sinceDate,
        },
      },
      orderBy: { updatedAt: "asc" },
    });

    // Преобразуем в формат фронтенда
    return chats.map((chat) => ({
      id: chat.id,
      name: chat.name,
      type: chat.type,
      category: chat.category,
      description: chat.description,
      icon: chat.icon,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    }));
  }

  /**
   * Получить обновлённые сообщения после since
   */
  async getUpdatedMessages(since: number): Promise<any[]> {
    const sinceDate = new Date(since);
    const messages = await prisma.message.findMany({
      where: {
        updatedAt: {
          gt: sinceDate,
        },
      },
      orderBy: { updatedAt: "asc" },
    });

    return messages.map((msg) => ({
      id: msg.id,
      chatId: msg.chatId,
      userId: msg.userId,
      username: msg.username,
      text: msg.text,
      type: msg.type,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileType: msg.fileType,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
    }));
  }

  /**
   * Получить обновлённых друзей после since
   */
  async getUpdatedFriends(since: number): Promise<any[]> {
    const sinceDate = new Date(since);
    const friends = await prisma.friend.findMany({
      where: {
        createdAt: {
          gt: sinceDate,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return friends.map((friend) => ({
      id: friend.id,
      userId: friend.userId,
      friendId: friend.friendId,
      name: friend.name,
      email: friend.email,
      avatar: friend.avatar,
      createdAt: friend.createdAt.toISOString(),
    }));
  }

  /**
   * Получить обновлённый лидерборд после since
   */
  async getUpdatedLeaderboard(since: number): Promise<any[]> {
    const sinceDate = new Date(since);
    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        updatedAt: {
          gt: sinceDate,
        },
      },
      orderBy: { updatedAt: "asc" },
    });

    return entries.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      points: entry.points,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }));
  }

  /**
   * Получить обновлённые игры после since
   */
  async getUpdatedGames(since: number): Promise<any[]> {
    const sinceDate = new Date(since);
    
    // Получаем обновлённые Game
    const games = await prisma.game.findMany({
      orderBy: { id: "asc" },
    });

    // Получаем обновлённые GameUnlock
    const unlocks = await prisma.gameUnlock.findMany({
      where: {
        unlockedAt: {
          gt: sinceDate,
        },
      },
      orderBy: { unlockedAt: "asc" },
    });

    // Объединяем в формат фронтенда
    const result: any[] = [];
    
    // Добавляем игры
    games.forEach((game) => {
      result.push({
        id: game.id,
        displayName: game.displayName,
        unlockPrice: game.unlockPrice,
      });
    });

    // Добавляем разблокировки
    unlocks.forEach((unlock) => {
      result.push({
        id: unlock.id,
        userId: unlock.userId,
        gameId: unlock.gameId,
        unlockedAt: unlock.unlockedAt.toISOString(),
      });
    });

    return result;
  }
}

