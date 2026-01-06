import { Router } from "express";
import { ComplaintController } from "../controllers/ComplaintController";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { validateBody, validateQuery } from "../middlewares/validation.middleware";
import {
  createComplaintSchema,
  updateComplaintStatusSchema,
  complaintListQuerySchema,
} from "../validators/complaint.validators";
import { complaintCreateRateLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();
const complaintController = new ComplaintController();

/**
 * POST /api/complaints
 * Создать жалобу
 * - Требуется авторизация
 * - Rate limit: 10 жалоб в час
 */
router.post(
  "/",
  authMiddleware,
  complaintCreateRateLimiter,
  validateBody(createComplaintSchema),
  complaintController.createComplaint.bind(complaintController)
);

/**
 * GET /api/complaints
 * Получить список жалоб
 * - Требуется авторизация + роль admin
 */
router.get(
  "/",
  authMiddleware,
  requireRole("admin"),
  validateQuery(complaintListQuerySchema),
  complaintController.getComplaints.bind(complaintController)
);

/**
 * GET /api/complaints/:id
 * Получить жалобу по ID
 * - Требуется авторизация + роль admin
 */
router.get(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  complaintController.getComplaintById.bind(complaintController)
);

/**
 * PATCH /api/complaints/:id/status
 * Обновить статус жалобы
 * - Требуется авторизация + роль admin
 */
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("admin"),
  validateBody(updateComplaintStatusSchema),
  complaintController.updateComplaintStatus.bind(complaintController)
);

export default router;


