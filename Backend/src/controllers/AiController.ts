import type { Request, Response, NextFunction } from "express";
import { AiService, type AssistantType } from "../services/AiService.js";

const aiService = new AiService();

export class AiController {
  private async handleChat(
    req: Request,
    res: Response,
    next: NextFunction,
    assistantType: AssistantType,
  ) {
    try {
      const userId = (req as any).user.id as string;
      const { message } = req.body as { message: string };

      if (!message || typeof message !== "string") {
        res.status(400).json({
          error: {
            code: "INVALID_MESSAGE",
            message: "Поле 'message' обязательно и должно быть строкой",
          },
        });
        return;
      }

      const result = await aiService.chat(userId, assistantType, message);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async cognia(req: Request, res: Response, next: NextFunction) {
    return this.handleChat(req, res, next, "cognia");
  }

  async trai(req: Request, res: Response, next: NextFunction) {
    return this.handleChat(req, res, next, "trai");
  }
}

export const aiController = new AiController();



