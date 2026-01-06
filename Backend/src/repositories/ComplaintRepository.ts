import { prisma } from "../lib/prisma";
import { Complaint, ComplaintTargetType, ComplaintStatus, Prisma } from "@prisma/client";

/**
 * Репозиторий для работы с жалобами
 * Только CRUD операции, без бизнес-логики
 */
export class ComplaintRepository {
  /**
   * Создать жалобу
   */
  async create(data: {
    reporterId: string;
    targetUserId?: string;
    targetContentId?: string;
    targetType: ComplaintTargetType;
    reason: string;
    comment?: string;
  }): Promise<Complaint> {
    return prisma.complaint.create({
      data: {
        reporterId: data.reporterId,
        targetUserId: data.targetUserId,
        targetContentId: data.targetContentId,
        targetType: data.targetType,
        reason: data.reason,
        comment: data.comment,
        status: "pending",
      },
    });
  }

  /**
   * Найти жалобу по ID
   */
  async findById(id: string): Promise<Complaint | null> {
    return prisma.complaint.findUnique({
      where: { id },
    });
  }

  /**
   * Найти жалобу по ID с отношениями (reporter, targetUser)
   */
  async findByIdWithRelations(id: string) {
    return prisma.complaint.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Проверить существование дубликата жалобы
   * Один reporter → один target → один reason (в пределах последних 24 часов)
   */
  async findDuplicate(params: {
    reporterId: string;
    targetUserId?: string;
    targetContentId?: string;
    targetType: ComplaintTargetType;
    reason: string;
    withinHours?: number;
  }): Promise<Complaint | null> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - (params.withinHours || 24));

    const where: Prisma.ComplaintWhereInput = {
      reporterId: params.reporterId,
      targetType: params.targetType,
      reason: params.reason,
      createdAt: {
        gte: cutoffTime,
      },
    };

    // Для типа "user" проверяем по targetUserId
    if (params.targetType === "user" && params.targetUserId) {
      where.targetUserId = params.targetUserId;
    }

    // Для типа "message" или "post" проверяем по targetContentId
    if ((params.targetType === "message" || params.targetType === "post") && params.targetContentId) {
      where.targetContentId = params.targetContentId;
    }

    return prisma.complaint.findFirst({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Подсчитать количество жалоб от пользователя за период
   */
  async countByReporter(params: {
    reporterId: string;
    since: Date;
  }): Promise<number> {
    return prisma.complaint.count({
      where: {
        reporterId: params.reporterId,
        createdAt: {
          gte: params.since,
        },
      },
    });
  }

  /**
   * Получить список жалоб с фильтрами и пагинацией
   */
  async findMany(params: {
    status?: ComplaintStatus;
    targetType?: ComplaintTargetType;
    targetUserId?: string;
    page: number;
    pageSize: number;
  }) {
    const skip = (params.page - 1) * params.pageSize;
    const where: Prisma.ComplaintWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.targetType) {
      where.targetType = params.targetType;
    }
    if (params.targetUserId) {
      where.targetUserId = params.targetUserId;
    }

    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Обновить статус жалобы
   */
  async updateStatus(
    id: string,
    status: Exclude<ComplaintStatus, "pending">,
    moderatorComment?: string
  ): Promise<Complaint> {
    return prisma.complaint.update({
      where: { id },
      data: {
        status,
        // Если есть moderatorComment, можно добавить отдельное поле в схему или использовать comment
        // Пока обновляем только status
        updatedAt: new Date(),
      },
    });
  }
}


