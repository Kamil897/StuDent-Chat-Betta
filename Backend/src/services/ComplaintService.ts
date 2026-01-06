import { ComplaintRepository } from "../repositories/ComplaintRepository";
import { UserRepository } from "../repositories/UserRepository";
import {
  CreateComplaintDto,
  ComplaintDto,
  UpdateComplaintStatusDto,
  ComplaintListQuery,
  ComplaintListDto,
} from "../dtos/complaint.dto";
// import type { ComplaintTargetType, ComplaintStatus } from "@prisma/client";

/**
 * Сервис для работы с жалобами
 * Бизнес-логика: проверки на дубли, само-жалобы, rate limit
 */
export class ComplaintService {
  private complaintRepository: ComplaintRepository;
  private userRepository: UserRepository;

  constructor() {
    this.complaintRepository = new ComplaintRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Создать жалобу
   * Проверки:
   * - Нельзя жаловаться на самого себя
   * - Защита от дублей
   * - Rate limit (проверяется в middleware, но можно добавить дополнительную логику)
   */
  async createComplaint(
    reporterId: string,
    data: CreateComplaintDto
  ): Promise<ComplaintDto> {
    // 1. Проверка: нельзя жаловаться на самого себя
    if (data.targetType === "user" && data.targetUserId === reporterId) {
      throw new Error("Нельзя жаловаться на самого себя");
    }

    // 2. Проверка существования целевого пользователя (если указан)
    if (data.targetType === "user" && data.targetUserId) {
      const targetUser = await this.userRepository.findById(data.targetUserId);
      if (!targetUser) {
        throw new Error("Целевой пользователь не найден");
      }
    }

    // 3. Проверка на дубликат (один reporter → один target → один reason за 24 часа)
    const duplicate = await this.complaintRepository.findDuplicate({
      reporterId,
      targetUserId: data.targetUserId,
      targetContentId: data.targetContentId,
      targetType: data.targetType,
      reason: data.reason,
      withinHours: 24,
    });

    if (duplicate) {
      throw new Error("Похожая жалоба уже была подана недавно");
    }

    // 4. Проверка rate limit (количество жалоб за последний час)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const complaintsCount = await this.complaintRepository.countByReporter({
      reporterId,
      since: oneHourAgo,
    });

    // Максимум 10 жалоб в час от одного пользователя
    if (complaintsCount >= 10) {
      console.warn(`[ComplaintService] Rate limit exceeded for user ${reporterId}: ${complaintsCount} complaints in last hour`);
      throw new Error("Превышен лимит жалоб. Попробуйте позже");
    }

    // 5. Создание жалобы
    const complaint = await this.complaintRepository.create({
      reporterId,
      targetUserId: data.targetUserId,
      targetContentId: data.targetContentId,
      targetType: data.targetType,
      reason: data.reason,
      comment: data.comment,
    });

    // Логирование для безопасности
    console.log(`[ComplaintService] Complaint created: ${complaint.id} by ${reporterId} on ${data.targetType} ${data.targetUserId || data.targetContentId || "unknown"}`);

    return this.mapToDto(complaint);
  }

  /**
   * Получить список жалоб (admin only)
   */
  async getComplaints(query: ComplaintListQuery): Promise<ComplaintListDto> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const result = await this.complaintRepository.findMany({
      status: query.status,
      targetType: query.targetType,
      targetUserId: query.targetUserId,
      page,
      pageSize,
    });

    return {
      items: result.items.map((item: any) => this.mapToDto(item)),
      page,
      pageSize,
      total: result.total,
    };
  }

  /**
   * Получить жалобу по ID (admin only)
   */
  async getComplaintById(id: string): Promise<ComplaintDto | null> {
    const complaint = await this.complaintRepository.findByIdWithRelations(id);
    if (!complaint) {
      return null;
    }
    return this.mapToDto(complaint);
  }

  /**
   * Обновить статус жалобы (admin only)
   */
  async updateComplaintStatus(
    id: string,
    data: UpdateComplaintStatusDto,
    moderatorId: string
  ): Promise<ComplaintDto> {
    const complaint = await this.complaintRepository.findById(id);
    if (!complaint) {
      throw new Error("Жалоба не найдена");
    }

    if (complaint.status !== "pending") {
      throw new Error("Можно обновлять только жалобы со статусом 'pending'");
    }

    const updated = await this.complaintRepository.updateStatus(
      id,
      data.status,
      data.moderatorComment
    );

    console.log(`[ComplaintService] Complaint ${id} status updated to ${data.status} by moderator ${moderatorId}`);

    return this.mapToDto(updated);
  }

  /**
   * Маппинг Prisma модели в DTO
   */
  private mapToDto(complaint: any): ComplaintDto {
    return {
      id: complaint.id,
      reporterId: complaint.reporterId,
      targetUserId: complaint.targetUserId || undefined,
      targetContentId: complaint.targetContentId || undefined,
      targetType: complaint.targetType,
      reason: complaint.reason,
      comment: complaint.comment || undefined,
      status: complaint.status,
      createdAt: complaint.createdAt.toISOString(),
      updatedAt: complaint.updatedAt.toISOString(),
    };
  }
}

