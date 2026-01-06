import { UserRepository } from "../repositories/UserRepository.js";

export interface UserSearchResult {
  id: string;
  username: string;
  name: string;
  surname: string | null;
  email: string;
  avatarSeed: string | null;
}

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Поиск пользователей по нику/имени
   */
  async searchUsers(query: string, limit: number = 20): Promise<UserSearchResult[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const searchTerm = query.trim(); // Убираем % - они не нужны для Prisma contains

      const users = await this.userRepository.search(searchTerm, limit);

      return users.map((user: any) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        surname: user.surname || null,
        email: user.email,
        avatarSeed: user.avatarSeed,
      }));
    } catch (error: any) {
      console.error("[UserService] Search users error:", error);
      return [];
    }
  }

  /**
   * Получить пользователя по ID
   */
  async getUserById(userId: string): Promise<UserSearchResult | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      email: user.email,
      avatarSeed: user.avatarSeed,
    };
  }
}


