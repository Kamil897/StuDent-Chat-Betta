import { z } from "zod";
import { ComplaintTargetType, ComplaintStatus } from "@prisma/client";

/**
 * Валидатор для создания жалобы
 */
export const createComplaintSchema = z.object({
  targetType: z.nativeEnum(ComplaintTargetType),
  targetUserId: z.string().uuid().optional(),
  targetContentId: z.string().optional(),
  reason: z.string().min(1).max(100),
  comment: z.string().max(2000).optional(),
}).refine(
  (data) => {
    // Если targetType = "user", то targetUserId обязателен
    if (data.targetType === "user" && !data.targetUserId) {
      return false;
    }
    // Если targetType = "message" или "post", то targetContentId желателен
    if ((data.targetType === "message" || data.targetType === "post") && !data.targetContentId) {
      return false;
    }
    return true;
  },
  {
    message: "targetUserId обязателен для типа 'user', targetContentId желателен для 'message' и 'post'",
  }
);

/**
 * Валидатор для обновления статуса жалобы
 */
export const updateComplaintStatusSchema = z.object({
  status: z.nativeEnum(ComplaintStatus).refine(
    (val) => val !== "pending",
    { message: "Статус не может быть 'pending' при обновлении" }
  ),
  moderatorComment: z.string().max(2000).optional(),
});

/**
 * Валидатор для query параметров списка жалоб
 */
export const complaintListQuerySchema = z.object({
  status: z.nativeEnum(ComplaintStatus).optional(),
  targetType: z.nativeEnum(ComplaintTargetType).optional(),
  targetUserId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});


