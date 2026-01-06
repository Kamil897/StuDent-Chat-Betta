import type { Prisma, User } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export class UserRepository {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  /**
   * Поиск пользователей по нику/имени/фамилии
   * MySQL не поддерживает mode: "insensitive" в Prisma, используем простой поиск
   */
  async search(searchTerm: string, limit: number = 20): Promise<User[]> {
    try {
      const cleanTerm = searchTerm.replace(/%/g, "").trim();
      
      if (!cleanTerm || cleanTerm.length < 2) {
        return [];
      }
      
      // Используем простой поиск (MySQL по умолчанию case-insensitive для большинства коллаций)
      // Ищем по username, name и email
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: cleanTerm } },
            { name: { contains: cleanTerm } },
            { email: { contains: cleanTerm } },
          ],
        },
        take: limit,
        select: {
          id: true,
          username: true,
          name: true,
          surname: true,
          email: true,
          avatarSeed: true,
        },
      });
      
      return users as any;
      
      return users as any;
    } catch (error: any) {
      console.error("[UserRepository] Search error:", error);
      // Возвращаем пустой массив при ошибке вместо выбрасывания исключения
      return [];
    }
  }
}

export const userRepository = new UserRepository();


