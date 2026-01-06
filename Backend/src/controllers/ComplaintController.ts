import { Request, Response } from "express";
import { ComplaintService } from "../services/ComplaintService";
import { CreateComplaintDto, UpdateComplaintStatusDto, ComplaintListQuery } from "../dtos/complaint.dto";

/**
 * Контроллер для работы с жалобами
 */
export class ComplaintController {
  private complaintService: ComplaintService;

  constructor() {
    this.complaintService = new ComplaintService();
  }

  /**
   * POST /api/complaints
   * Создать жалобу (авторизованный пользователь)
   */
  async createComplaint(req: Request, res: Response): Promise<void> {
    try {
      const reporterId = (req as any).user.id;
      const data: CreateComplaintDto = req.body;

      const complaint = await this.complaintService.createComplaint(reporterId, data);

      res.status(201).json({ complaint });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: "COMPLAINT_CREATE_ERROR",
          message: error.message || "Ошибка при создании жалобы",
        },
      });
    }
  }

  /**
   * GET /api/complaints
   * Получить список жалоб (admin only)
   */
  async getComplaints(req: Request, res: Response): Promise<void> {
    try {
      const query: ComplaintListQuery = {
        status: req.query.status as any,
        targetType: req.query.targetType as any,
        targetUserId: req.query.targetUserId as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      };

      const result = await this.complaintService.getComplaints(query);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: "COMPLAINT_LIST_ERROR",
          message: error.message || "Ошибка при получении списка жалоб",
        },
      });
    }
  }

  /**
   * GET /api/complaints/:id
   * Получить жалобу по ID (admin only)
   */
  async getComplaintById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const complaint = await this.complaintService.getComplaintById(id);

      if (!complaint) {
        res.status(404).json({
          error: {
            code: "COMPLAINT_NOT_FOUND",
            message: "Жалоба не найдена",
          },
        });
        return;
      }

      res.status(200).json({ complaint });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: "COMPLAINT_GET_ERROR",
          message: error.message || "Ошибка при получении жалобы",
        },
      });
    }
  }

  /**
   * PATCH /api/complaints/:id/status
   * Обновить статус жалобы (admin only)
   */
  async updateComplaintStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const moderatorId = (req as any).user.id;
      const data: UpdateComplaintStatusDto = req.body;

      const complaint = await this.complaintService.updateComplaintStatus(id, data, moderatorId);

      res.status(200).json({ complaint });
    } catch (error: any) {
      const statusCode = error.message?.includes("не найдена") ? 404 : 400;
      res.status(statusCode).json({
        error: {
          code: "COMPLAINT_UPDATE_ERROR",
          message: error.message || "Ошибка при обновлении статуса жалобы",
        },
      });
    }
  }
}


