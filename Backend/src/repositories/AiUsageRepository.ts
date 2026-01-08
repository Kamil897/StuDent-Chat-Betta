import { prisma } from "../lib/prisma.js";

const client = prisma as any;

export class AiUsageRepository {
  private normalizeDate(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async getUsageCount(userId: string, assistantType: string, date: Date) {
    const day = this.normalizeDate(date);
    const usage = await client.aiUsage.findUnique({
      where: {
        userId_assistantType_date: {
          userId,
          assistantType,
          date: day,
        },
      },
    });
    return usage?.count ?? 0;
  }

  async incrementUsage(
    userId: string,
    assistantType: string,
    date: Date,
  ): Promise<number> {
    const day = this.normalizeDate(date);
    const existing = await client.aiUsage.findUnique({
      where: {
        userId_assistantType_date: {
          userId,
          assistantType,
          date: day,
        },
      },
    });

    if (!existing) {
      const created = await client.aiUsage.create({
        data: {
          userId,
          assistantType,
          date: day,
          count: 1,
        },
      });
      return created.count;
    }

    const updated = await client.aiUsage.update({
      where: { id: existing.id },
      data: { count: existing.count + 1 },
    });
    return updated.count;
  }
}




