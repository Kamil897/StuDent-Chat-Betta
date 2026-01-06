import { AiRepository } from "../repositories/AiRepository.js";
import { PointsService } from "./PointsService.js";
import { SubscriptionRepository } from "../repositories/SubscriptionRepository.js";
import { AiUsageRepository } from "../repositories/AiUsageRepository.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const ASSISTANT_COGNIA_ID =
  process.env.OPENAI_ASSISTANT_COGNIA_ID || "asst_iHlf5gxAhgS2R9sJI3svvvOl";
const ASSISTANT_TRAI_ID =
  process.env.OPENAI_ASSISTANT_TRAI_ID || "asst_GgxV7wSMhQd35Q8YZfKgeHO0";

export type AssistantType = "cognia" | "trai";

export class AiService {
  private aiRepository = new AiRepository();
  private pointsService = new PointsService();
  private subscriptionRepository = new SubscriptionRepository();
  private aiUsageRepository = new AiUsageRepository();

  private getAssistantId(type: AssistantType): string {
    return type === "cognia" ? ASSISTANT_COGNIA_ID : ASSISTANT_TRAI_ID;
  }

  private async createThread(): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.statusText}`);
    }
    const data: any = await response.json();
    return data.id;
  }

  private async sendMessageToAssistant(
    threadId: string,
    assistantId: string,
    message: string,
  ): Promise<string> {
    // 1. Добавляем сообщение пользователя
    const messageResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          role: "user",
          content: message,
        }),
      },
    );

    if (!messageResponse.ok) {
      throw new Error(`Failed to send message: ${messageResponse.statusText}`);
    }

    // 2. Запускаем ассистента
    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          assistant_id: assistantId,
        }),
      },
    );

    if (!runResponse.ok) {
      throw new Error(`Failed to run assistant: ${runResponse.statusText}`);
    }

    const runData: any = await runResponse.json();
    const runId = runData.id;

    // 3. Ждём завершения
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60;

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        },
      );

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to check run status: ${statusResponse.statusText}`,
        );
      }

      const statusData: any = await statusResponse.json();
      if (statusData.status === "completed") {
        completed = true;
      } else if (statusData.status === "failed") {
        throw new Error("Assistant run failed");
      }

      attempts++;
    }

    if (!completed) {
      throw new Error("Assistant run timed out");
    }

    // 4. Получаем ответ
    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      },
    );

    if (!messagesResponse.ok) {
      throw new Error(`Failed to get messages: ${messagesResponse.statusText}`);
    }

    const messagesData: any = await messagesResponse.json();
    const assistantMessages = messagesData.data.filter(
      (msg: any) => msg.role === "assistant",
    );

    if (assistantMessages.length === 0) {
      throw new Error("No response from assistant");
    }

    const lastMessage = assistantMessages[0];
    const content = lastMessage.content[0];
    return content.text.value as string;
  }

  async chat(
    userId: string,
    assistantType: AssistantType,
    message: string,
  ): Promise<{ reply: string }> {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured on backend");
    }

    // лимиты: базовый и премиум
    const BASE_LIMIT = 10;
    const PREMIUM_LIMIT = 1000;

    const today = new Date();
    const subscriptionType = assistantType; // \"cognia\" | \"trai\"
    const hasSubscription =
      (await this.subscriptionRepository.getActiveSubscription(
        userId,
        subscriptionType,
      )) != null;

    const limit = hasSubscription ? PREMIUM_LIMIT : BASE_LIMIT;

    const usedToday = await this.aiUsageRepository.getUsageCount(
      userId,
      assistantType,
      today,
    );

    if (usedToday >= limit) {
      const err: any = new Error(
        `Лимит запросов к ${assistantType} исчерпан на сегодня`,
      );
      err.statusCode = 429;
      throw err;
    }

    // 1. Готовим профиль пользователя (для будущего использования в промпте/контексте)
    const profile = await this.aiRepository.getOrCreateUserProfile(userId);

    // 2. Получаем или создаём разговор
    let conversation = await this.aiRepository.getOrCreateConversation(
      userId,
      assistantType,
    );

    // 3. Создаём thread, если его ещё нет
    let threadId = conversation.openAiThreadId;
    if (!threadId) {
      threadId = await this.createThread();
      await this.aiRepository.updateConversationThreadId(conversation.id, threadId);
      conversation = { ...conversation, openAiThreadId: threadId } as any;
    }

    // 4. Формируем сообщение с учётом профиля
    const enrichedMessage = `User profile: ${JSON.stringify(
      {
        name: profile.bio ?? "",
        preferences: profile.preferences ?? {},
      },
    )}\n\nUser message: ${message}`;

    const assistantId = this.getAssistantId(assistantType);

    // 5. Сохраняем сообщение пользователя в нашу БД
    await this.aiRepository.addMessage(conversation.id, "user", message);

    // 6. Отправляем в OpenAI
    const reply = await this.sendMessageToAssistant(
      threadId!,
      assistantId,
      enrichedMessage,
    );

    // 7. Сохраняем ответ ассистента
    await this.aiRepository.addMessage(conversation.id, "assistant", reply);

    // 8. (Опционально) награда за использование AI
    await this.pointsService.addReward(userId, 1, `ai:${assistantType}`);

    // 9. Увеличиваем счётчик использования
    await this.aiUsageRepository.incrementUsage(userId, assistantType, today);

    return { reply };
  }
}


