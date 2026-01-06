import { prisma } from "../lib/prisma.js";

const client = prisma as any;

export class AiRepository {
  async getOrCreateUserProfile(userId: string) {
    const existing = await client.aiUserProfile.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    return client.aiUserProfile.create({
      data: {
        userId,
      },
    });
  }

  async getOrCreateConversation(userId: string, assistantType: string) {
    const existing = await client.aiConversation.findFirst({
      where: { userId, assistantType },
      orderBy: { updatedAt: "desc" },
    });
    if (existing) return existing;

    return client.aiConversation.create({
      data: {
        userId,
        assistantType,
      },
    });
  }

  async updateConversationThreadId(
    conversationId: string,
    openAiThreadId: string,
  ) {
    return client.aiConversation.update({
      where: { id: conversationId },
      data: {
        openAiThreadId,
      },
    });
  }

  async addMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
  ) {
    return client.aiMessage.create({
      data: {
        conversationId,
        role,
        content,
      },
    });
  }

  async getRecentMessages(conversationId: string, limit = 20) {
    return client.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}


