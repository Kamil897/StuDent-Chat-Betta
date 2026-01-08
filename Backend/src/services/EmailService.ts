import nodemailer from "nodemailer";

/**
 * Email Service
 * Handles sending emails using SMTP
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // SMTP configuration from environment variables
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPassword = process.env.SMTP_PASSWORD || "";
    const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@student-chat.com";
    const smtpFromName = process.env.SMTP_FROM_NAME || "Student Chat";

    // If SMTP credentials are not configured, use console logging in development
    if (!smtpUser || !smtpPassword) {
      console.warn("[EmailService] SMTP credentials not configured. Emails will be logged to console.");
      this.transporter = null;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        // For Gmail, you might need to enable "Less secure app access" or use App Password
        // For other providers, adjust settings accordingly
      });

      // Store from address for later use
      (this.transporter as any).fromAddress = smtpFrom;
      (this.transporter as any).fromName = smtpFromName;
    } catch (error) {
      console.error("[EmailService] Failed to initialize transporter:", error);
      this.transporter = null;
    }
  }

  /**
   * Test email connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.warn("[EmailService] Transporter not initialized");
      return false;
    }

    try {
      await this.transporter.verify();
      console.log("[EmailService] SMTP connection verified");
      return true;
    } catch (error) {
      console.error("[EmailService] SMTP connection failed:", error);
      return false;
    }
  }

  /**
   * Send verification code email
   */
  async sendVerificationCode(email: string, code: string, userName?: string): Promise<boolean> {
    const fromName = (this.transporter as any)?.fromName || "Student Chat";
    const fromAddress = (this.transporter as any)?.fromAddress || "noreply@student-chat.com";

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Код верификации</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .code-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .message {
            color: #666;
            font-size: 16px;
            margin-bottom: 20px;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #856404;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Student Chat</div>
        </div>
        
        <h1 style="color: #333; margin-bottom: 20px;">Подтверждение Email</h1>
        
        <p class="message">
            ${userName ? `Здравствуйте, ${userName}!` : "Здравствуйте!"}
        </p>
        
        <p class="message">
            Спасибо за регистрацию в Student Chat! Для завершения регистрации необходимо подтвердить ваш email адрес.
        </p>
        
        <p class="message" style="font-weight: 600; color: #333;">
            Введите следующий код верификации:
        </p>
        
        <div class="code-container">
            <div class="code">${code}</div>
        </div>
        
        <div class="warning">
            <strong>⚠️ Важно:</strong> Этот код действителен в течение 15 минут. Не передавайте его никому.
        </div>
        
        <p class="message" style="font-size: 14px; color: #999;">
            Если вы не регистрировались в Student Chat, просто проигнорируйте это письмо.
        </p>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Student Chat. Все права защищены.</p>
            <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
        </div>
    </div>
</body>
</html>
    `;

    const textTemplate = `
Student Chat - Код верификации

${userName ? `Здравствуйте, ${userName}!` : "Здравствуйте!"}

Спасибо за регистрацию в Student Chat! Для завершения регистрации необходимо подтвердить ваш email адрес.

Ваш код верификации: ${code}

Этот код действителен в течение 15 минут.

Если вы не регистрировались в Student Chat, просто проигнорируйте это письмо.

© ${new Date().getFullYear()} Student Chat
    `;

    return this.sendEmail({
      to: email,
      subject: "Код верификации Student Chat",
      html: htmlTemplate,
      text: textTemplate,
      from: `"${fromName}" <${fromAddress}>`,
    });
  }

  /**
   * Generic email sending method
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
    from: string;
  }): Promise<boolean> {
    // If transporter is not configured, log to console (development mode)
    if (!this.transporter) {
      console.log("\n" + "=".repeat(60));
      console.log("[EmailService] Email would be sent:");
      console.log("From:", options.from);
      console.log("To:", options.to);
      console.log("Subject:", options.subject);
      console.log("Text:", options.text);
      console.log("=".repeat(60) + "\n");
      return true; // Return true in dev mode so registration doesn't fail
    }

    try {
      const info = await this.transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log("[EmailService] Email sent successfully:", info.messageId);
      return true;
    } catch (error: any) {
      console.error("[EmailService] Failed to send email:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
