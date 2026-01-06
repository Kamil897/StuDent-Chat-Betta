const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const ASSISTANT_IDS = {
  COGNIA: "asst_iHlf5gxAhgS2R9sJI3svvvOl",
  TRAI: "asst_GgxV7wSMhQd35Q8YZfKgeHO0",
} as const;

// Получить токен авторизации из localStorage
function getAuthToken(): string | null {
  try {
    // Проверяем разные возможные ключи для токена
    const token = localStorage.getItem("accessToken") || 
                  localStorage.getItem("token") ||
                  localStorage.getItem("authToken");
    return token;
  } catch {
    return null;
  }
}

export async function createThread(): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error creating thread:", error);
    throw error;
  }
}

export async function sendMessageToAssistant(
  threadId: string,
  assistantId: string,
  message: string
): Promise<string> {
  // Пытаемся использовать бэкенд API сначала
  const token = getAuthToken();
  if (token) {
    try {
      const assistantType = assistantId === ASSISTANT_IDS.COGNIA ? "cognia" : "trai";
      const response = await fetch(`${API_BASE_URL}/ai/${assistantType}/message`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.reply || data.response || String(data);
      }
      
      // Если 401 или 403 - пробуем fallback
      if (response.status === 401 || response.status === 403) {
        console.warn("Auth failed, falling back to direct OpenAI API");
      } else {
        // Другие ошибки - пробуем fallback
        console.warn("Backend API error, falling back to direct OpenAI API");
      }
    } catch (error) {
      console.warn("Backend API request failed, falling back to direct OpenAI API:", error);
    }
  }

  // Fallback: прямые вызовы OpenAI API
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured and backend auth failed");
  }

  try {
    // Add message to thread
    const messageResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          role: "user",
          content: message,
        }),
      }
    );

    if (!messageResponse.ok) {
      throw new Error(`Failed to send message: ${messageResponse.statusText}`);
    }

    // Run the assistant
    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          assistant_id: assistantId,
        }),
      }
    );

    if (!runResponse.ok) {
      throw new Error(`Failed to run assistant: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60;

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
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

    // Get the response
    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error(`Failed to get messages: ${messagesResponse.statusText}`);
    }

    const messagesData = await messagesResponse.json();
    const assistantMessages = messagesData.data.filter(
      (msg: any) => msg.role === "assistant"
    );

    if (assistantMessages.length === 0) {
      throw new Error("No response from assistant");
    }

    const lastMessage = assistantMessages[0];
    const content = lastMessage.content[0];
    return content.text.value;
  } catch (error) {
    console.error("Error sending message to assistant:", error);
    throw error;
  }
}

export async function checkIELTSEssay(
  essay: string,
  taskType: string,
  prompt: string
): Promise<{
  band: number;
  feedback: {
    taskAchievement: string;
    coherence: string;
    lexicalResource: string;
    grammar: string;
  };
}> {
  // Пытаемся использовать бэкенд API сначала
  const token = getAuthToken();
  if (token) {
    try {
      const message = `Task Type: ${taskType}\nPrompt: ${prompt}\n\nEssay:\n${essay}`;
      const response = await fetch(`${API_BASE_URL}/ai/trai/message`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.reply || data.response || String(data);
        
        // Try to parse JSON from response
        try {
          const parsed = JSON.parse(reply);
          return parsed;
        } catch {
          // If parsing fails, extract band score and create feedback
          const bandMatch = reply.match(/band[:\s]+([0-9.]+)/i);
          const band = bandMatch ? parseFloat(bandMatch[1]) : 6.0;
          
          return {
            band,
            feedback: {
              taskAchievement: "See full feedback in response.",
              coherence: "See full feedback in response.",
              lexicalResource: "See full feedback in response.",
              grammar: "See full feedback in response.",
            },
          };
        }
      }
    } catch (error) {
      console.warn("Backend API request failed, falling back:", error);
    }
  }

  // Fallback: прямые вызовы OpenAI API
  if (!OPENAI_API_KEY) {
    // Return mock data if API key is not configured
    return {
      band: 6.5,
      feedback: {
        taskAchievement: "Task addressed adequately.",
        coherence: "Coherent structure.",
        lexicalResource: "Good range of vocabulary.",
        grammar: "Few grammar mistakes.",
      },
    };
  }

  try {
    // Use Trai assistant via Assistants API
    const threadId = await createThread();
    
    const message = `Task Type: ${taskType}\nPrompt: ${prompt}\n\nEssay:\n${essay}`;
    const response = await sendMessageToAssistant(threadId, ASSISTANT_IDS.TRAI, message);
    
    // Try to parse JSON from response
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      // If parsing fails, extract band score and create feedback
      const bandMatch = response.match(/band[:\s]+([0-9.]+)/i);
      const band = bandMatch ? parseFloat(bandMatch[1]) : 6.0;
      
      return {
        band,
        feedback: {
          taskAchievement: "See full feedback in response.",
          coherence: "See full feedback in response.",
          lexicalResource: "See full feedback in response.",
          grammar: "See full feedback in response.",
        },
      };
    }
  } catch (error) {
    console.error("Error checking IELTS essay:", error);
    throw error;
  }
}

// Default export for backward compatibility
const openai = {
  createThread,
  sendMessageToAssistant,
  ASSISTANT_IDS,
};

export default openai;

