import { prisma } from "../lib/prisma.js";

type UserWithRoles = any;

export class AuthRepository {
  async getUserWithRolesById(userId: string): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
  }

  async getUserWithRolesByEmailOrUsername(identifier: { email?: string; username?: string }): Promise<UserWithRoles | null> {
    if (identifier.email) {
      return prisma.user.findUnique({
        where: { email: identifier.email },
        include: { roles: true },
      });
    }
    if (identifier.username) {
      return prisma.user.findUnique({
        where: { username: identifier.username },
        include: { roles: true },
      });
    }
    return null;
  }

  async attachRoleToUser(userId: string, roleId: number): Promise<void> {
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }
}

export const authRepository = new AuthRepository();


