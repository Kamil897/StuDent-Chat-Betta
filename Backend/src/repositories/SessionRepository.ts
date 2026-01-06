import type { Prisma, Session } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export class SessionRepository {
  async create(data: Prisma.SessionCreateInput): Promise<Session> {
    return prisma.session.create({ data });
  }

  async findById(id: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { id } });
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { refreshToken: refreshTokenHash } });
  }

  async revokeById(id: string): Promise<void> {
    await prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByUserId(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const sessionRepository = new SessionRepository();



