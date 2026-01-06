import { prisma } from "../lib/prisma.js";

const client = prisma as any;

export class FriendRepository {
  /**
   * Создать заявку в друзья
   */
  async createFriendRequest(fromUserId: string, toUserId: string) {
    // Проверяем, не существует ли уже заявка
    const existing = await client.friendRequest.findFirst({
      where: {
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      },
    });

    if (existing) {
      throw new Error("Friend request already exists");
    }

    // Проверяем, не друзья ли уже
    const existingFriend = await client.friend.findFirst({
      where: {
        OR: [
          { userId: fromUserId, friendId: toUserId },
          { userId: toUserId, friendId: fromUserId },
        ],
      },
    });

    if (existingFriend) {
      throw new Error("Users are already friends");
    }

    return client.friendRequest.create({
      data: {
        fromUserId,
        toUserId,
        status: "pending",
      },
    });
  }

  /**
   * Принять заявку в друзья
   */
  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await client.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Friend request not found");
    }

    if (request.toUserId !== userId) {
      throw new Error("Unauthorized");
    }

    if (request.status !== "pending") {
      throw new Error("Friend request already processed");
    }

    // Обновляем статус заявки
    await client.friendRequest.update({
      where: { id: requestId },
      data: { status: "accepted" },
    });

    // Получаем информацию о пользователях
    const fromUser = await client.user.findUnique({
      where: { id: request.fromUserId },
      select: { id: true, username: true, name: true, surname: true, email: true, avatarSeed: true },
    });

    const toUser = await client.user.findUnique({
      where: { id: request.toUserId },
      select: { id: true, username: true, name: true, surname: true, email: true, avatarSeed: true },
    });

    if (!fromUser || !toUser) {
      throw new Error("User not found");
    }

    // Создаем дружбу в обе стороны
    await client.friend.createMany({
      data: [
        {
          userId: request.fromUserId,
          friendId: request.toUserId,
          name: `${toUser.name} ${toUser.surname || ""}`.trim() || toUser.username,
          email: toUser.email,
          avatar: toUser.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${toUser.avatarSeed}` : null,
        },
        {
          userId: request.toUserId,
          friendId: request.fromUserId,
          name: `${fromUser.name} ${fromUser.surname || ""}`.trim() || fromUser.username,
          email: fromUser.email,
          avatar: fromUser.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${fromUser.avatarSeed}` : null,
        },
      ],
      skipDuplicates: true,
    });

    return {
      friend: {
        id: fromUser.id,
        name: `${fromUser.name} ${fromUser.surname || ""}`.trim() || fromUser.username,
        email: fromUser.email,
        avatar: fromUser.avatarSeed ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${fromUser.avatarSeed}` : null,
      },
    };
  }

  /**
   * Отклонить заявку в друзья
   */
  async rejectFriendRequest(requestId: string, userId: string) {
    const request = await client.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Friend request not found");
    }

    if (request.toUserId !== userId) {
      throw new Error("Unauthorized");
    }

    await client.friendRequest.update({
      where: { id: requestId },
      data: { status: "rejected" },
    });
  }

  /**
   * Получить заявки пользователя
   */
  async getFriendRequests(userId: string) {
    const requests = await client.friendRequest.findMany({
      where: {
        toUserId: userId,
        status: "pending",
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            email: true,
            avatarSeed: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((req: any) => ({
      id: req.id,
      fromUserId: req.fromUserId,
      fromUserName: `${req.fromUser.name} ${req.fromUser.surname || ""}`.trim() || req.fromUser.username,
      toUserId: req.toUserId,
      toUserName: "",
      createdAt: req.createdAt.toISOString(),
    }));
  }

  /**
   * Получить список друзей пользователя
   */
  async getFriends(userId: string) {
    const friends = await client.friend.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return friends;
  }
}


