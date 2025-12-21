const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

export const ASSISTANT_IDS = {
  COGNIA: "asst_iHlf5gxAhgS2R9sJI3svvvOl",
  TRAI: "asst_GgxV7wSMhQd35Q8YZfKgeHO0",
} as const;

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
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
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

