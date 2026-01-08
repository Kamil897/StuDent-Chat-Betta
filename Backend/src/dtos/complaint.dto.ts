import { ComplaintTargetType, ComplaintStatus } from "@prisma/client";

/**
 * DTO для создания жалобы
 */
export interface CreateComplaintDto {
  targetType: ComplaintTargetType;
  targetUserId?: string;
  targetContentId?: string;
  reason: string;
  comment?: string;
}

/**
 * DTO для ответа с жалобой
 */
export interface ComplaintDto {
  id: string;
  reporterId: string;
  targetUserId?: string;
  targetContentId?: string;
  targetType: ComplaintTargetType;
  reason: string;
  comment?: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO для обновления статуса жалобы (admin)
 */
export interface UpdateComplaintStatusDto {
  status: Exclude<ComplaintStatus, "pending">;
  moderatorComment?: string;
}

/**
 * DTO для списка жалоб с пагинацией
 */
export interface ComplaintListDto {
  items: ComplaintDto[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Query параметры для списка жалоб
 */
export interface ComplaintListQuery {
  status?: ComplaintStatus;
  targetType?: ComplaintTargetType;
  targetUserId?: string;
  page?: number;
  pageSize?: number;
}



