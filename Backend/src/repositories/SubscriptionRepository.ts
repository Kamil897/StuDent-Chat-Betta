import { prisma } from "../lib/prisma.js";

const client = prisma as any;

export class SubscriptionRepository {
  async getActiveSubscription(userId: string, type: string) {
    const now = new Date();
    return client.userSubscription.findFirst({
      where: {
        userId,
        type,
        isActive: true,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "desc" },
    });
  }

  async activateSubscription(
    userId: string,
    type: string,
    durationDays: number,
  ) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    return client.userSubscription.create({
      data: {
        userId,
        type,
        startedAt: now,
        expiresAt,
        isActive: true,
      },
    });
  }

  async listUserSubscriptions(userId: string) {
    const now = new Date();
    return client.userSubscription.findMany({
      where: {
        userId,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "desc" },
    });
  }
}




