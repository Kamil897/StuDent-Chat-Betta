import { FriendRepository } from "../repositories/FriendRepository.js";
import { UserService } from "./UserService.js";

export class FriendService {
  private friendRepository: FriendRepository;
  private userService: UserService;

  constructor() {
    this.friendRepository = new FriendRepository();
    this.userService = new UserService();
  }

  /**
   * Отправить заявку в друзья по нику/имени
   */
  async sendFriendRequest(fromUserId: string, toUserName: string) {
    // Ищем пользователя по нику/имени
    const users = await this.userService.searchUsers(toUserName, 1);
    
    if (users.length === 0) {
      throw new Error("User not found");
    }

    const toUser = users[0];
    
    if (toUser.id === fromUserId) {
      throw new Error("Cannot send friend request to yourself");
    }

    const request = await this.friendRepository.createFriendRequest(fromUserId, toUser.id);
    
    return {
      id: request.id,
      fromUserId,
      toUserId: toUser.id,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    };
  }

  /**
   * Принять заявку в друзья
   */
  async acceptFriendRequest(requestId: string, userId: string) {
    return await this.friendRepository.acceptFriendRequest(requestId, userId);
  }

  /**
   * Отклонить заявку в друзья
   */
  async rejectFriendRequest(requestId: string, userId: string) {
    await this.friendRepository.rejectFriendRequest(requestId, userId);
  }

  /**
   * Получить заявки пользователя
   */
  async getFriendRequests(userId: string) {
    return await this.friendRepository.getFriendRequests(userId);
  }

  /**
   * Получить список друзей
   */
  async getFriends(userId: string) {
    return await this.friendRepository.getFriends(userId);
  }
}


