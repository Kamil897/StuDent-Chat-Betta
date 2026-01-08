import { userRepository } from "../repositories/UserRepository.js";
import { prisma } from "../lib/prisma.js";
import { emailService } from "./EmailService.js";

/**
 * Email Verification Service
 * Handles sending and verifying email verification codes
 */
export class EmailVerificationService {
  /**
   * Generate a 6-digit verification code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send verification code to email
   * In production, this would use a real email service (SendGrid, AWS SES, etc.)
   * For now, we'll just store the code in the database
   */
  async sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return { success: false, message: "Пользователь не найден" };
      }

      if (user.emailVerified) {
        return { success: false, message: "Email уже подтвержден" };
      }

      const code = this.generateCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Code expires in 15 minutes

      await prisma.user.update({
        where: { email },
        data: {
          emailVerificationCode: code,
          emailVerificationCodeExpires: expiresAt,
        },
      });

      // Send verification code via email
      const emailSent = await emailService.sendVerificationCode(
        email,
        code,
        user.name
      );

      if (!emailSent) {
        console.warn(`[EmailVerification] Failed to send email to ${email}, but code saved: ${code}`);
        // Still return success, but mention that email might not have been sent
        return {
          success: true,
          message: `Код верификации сохранен. ${process.env.SMTP_USER ? "Проверьте настройки SMTP." : "Настройте SMTP для отправки email. Код (для разработки): " + code}`,
        };
      }

      return {
        success: true,
        message: `Код верификации отправлен на ${email}`,
      };
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      return { success: false, message: "Ошибка при отправке кода" };
    }
  }

  /**
   * Verify email with code
   */
  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return { success: false, message: "Пользователь не найден" };
      }

      if (user.emailVerified) {
        return { success: false, message: "Email уже подтвержден" };
      }

      if (!user.emailVerificationCode || !user.emailVerificationCodeExpires) {
        return { success: false, message: "Код верификации не найден. Запросите новый код" };
      }

      // Check if code expired
      if (new Date() > user.emailVerificationCodeExpires) {
        return { success: false, message: "Код верификации истек. Запросите новый код" };
      }

      // Verify code
      if (user.emailVerificationCode !== code) {
        return { success: false, message: "Неверный код верификации" };
      }

      // Mark email as verified
      await prisma.user.update({
        where: { email },
        data: {
          emailVerified: true,
          emailVerificationCode: null,
          emailVerificationCodeExpires: null,
        },
      });

      return { success: true, message: "Email успешно подтвержден" };
    } catch (error: any) {
      console.error("Error verifying email:", error);
      return { success: false, message: "Ошибка при проверке кода" };
    }
  }
}

export const emailVerificationService = new EmailVerificationService();
