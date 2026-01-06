import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import s from "./AiChat.module.scss";
import { createThread, sendMessageToAssistant, ASSISTANT_IDS } from "../../utils/openai";
import { useTranslation } from "react-i18next";

type Chat = {
  id: number;
  title: string;
  threadId?: string; // OpenAI thread ID
};

type Message = {
  role: "user" | "ai";
  text: string;
};

const AiChat: React.FC = () => {
  const [chatList, setChatList] = useState<Chat[]>(() => {
    return JSON.parse(localStorage.getItem("chatList") || "[]");
  });
  const { t } = useTranslation();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  // Автоскролл
  useEffect(() => {
    // Используем setTimeout для корректного автоскролла после рендера
    const timer = setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // Загрузка сообщений
  const loadChat = (chatId: number) => {
    setSelectedChat(chatId);
    const saved = JSON.parse(localStorage.getItem(`chat_${chatId}`) || "[]");
    setMessages(saved);
    // Thread ID is already saved in chatList, no need to load separately
  };

  // Создать чат
  const newChat = async (initialMessage?: string) => {
    const id = Date.now();

    const newChatObj: Chat = {
      id,
      title: initialMessage ? initialMessage.substring(0, 30) : `Chat ${chatList.length + 1}`,
    };

    const updated = [...chatList, newChatObj];
    setChatList(updated);
    localStorage.setItem("chatList", JSON.stringify(updated));

    setSelectedChat(id);
    setMessages([]);
    localStorage.setItem(`chat_${id}`, "[]");

    // Create thread for new chat
    let threadId: string | undefined;
    try {
      threadId = await createThread();
      saveThreadId(id, threadId);
    } catch (error) {
      console.error("Error creating thread for new chat:", error);
      // Thread will be created when first message is sent
    }

    // If there's an initial message, send it immediately
    if (initialMessage) {
      if (!threadId) {
        // Try to create thread again if it wasn't created
        try {
          threadId = await createThread();
          saveThreadId(id, threadId);
        } catch (error) {
          console.error("Error creating thread for initial message:", error);
          return;
        }
      }
      
      const userMsg: Message = { role: "user", text: initialMessage };
      setMessages([userMsg]);
      saveMessages(id, [userMsg]);
      setMessage("");

      setIsLoading(true);
      try {
        const reply = await sendMessageToAssistant(threadId, ASSISTANT_IDS.COGNIA, initialMessage);
        const aiMsg: Message = { role: "ai", text: reply };
        const finalMessages = [userMsg, aiMsg];
        setMessages(finalMessages);
        saveMessages(id, finalMessages);
      } catch (error) {
        console.error("Error sending initial message:", error);
        const errorMsg: Message = {
          role: "ai",
          text: `Ошибка: ${error instanceof Error ? error.message : "Не удалось получить ответ от AI"}`,
        };
        const finalMessages = [userMsg, errorMsg];
        setMessages(finalMessages);
        saveMessages(id, finalMessages);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Удалить чат
  const deleteChat = (chatId: number) => {
    if (!window.confirm("Удалить чат?")) return;

    const updated = chatList.filter((c) => c.id !== chatId);
    setChatList(updated);
    localStorage.setItem("chatList", JSON.stringify(updated));

    localStorage.removeItem(`chat_${chatId}`);

    if (selectedChat === chatId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  // Сохранить сообщения
  const saveMessages = (chatId: number, msgs: Message[]) => {
    localStorage.setItem(`chat_${chatId}`, JSON.stringify(msgs));
  };

  // Сохранить thread ID для чата
  const saveThreadId = (chatId: number, threadId: string) => {
    setChatList((prevChatList) => {
      const updated = prevChatList.map((chat) =>
        chat.id === chatId ? { ...chat, threadId } : chat
      );
      localStorage.setItem("chatList", JSON.stringify(updated));
      return updated;
    });
  };

  // Получить thread ID для чата или создать новый
  const getOrCreateThread = async (chatId: number): Promise<string> => {
    // Check current chatList state
    const currentChat = chatList.find((c) => c.id === chatId);
    if (currentChat?.threadId) {
      return currentChat.threadId;
    }

    // Create new thread
    const threadId = await createThread();
    saveThreadId(chatId, threadId);
    return threadId;
  };

  const sendMessage = async () => {
    if (!message.trim() || selectedChat === null) return;

    const userMsg: Message = { role: "user", text: message };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    saveMessages(selectedChat, newMessages);
    setMessage("");

    setIsLoading(true);

    try {
      // Get or create thread for this chat
      const threadId = await getOrCreateThread(selectedChat);

      // Send message to OpenAI Assistant
      const reply = await sendMessageToAssistant(
        threadId,
        ASSISTANT_IDS.COGNIA,
        message
      );

      const aiMsg: Message = { role: "ai", text: reply };

      const updated = [...newMessages, aiMsg];
      setMessages(updated);
      saveMessages(selectedChat, updated);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg: Message = {
        role: "ai",
        text: `Ошибка: ${error instanceof Error ? error.message : "Не удалось получить ответ от AI"}`,
      };
      const updated = [...newMessages, errorMsg];
      setMessages(updated);
      saveMessages(selectedChat, updated);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={s.chatWrapper}>
      {/* Sidebar */}
      <div className={s.sidebar}>
        <h2>{t("AIchat.sidebar.title")}</h2>

        <button onClick={() => newChat()} className={s.newChat}>
          + {t("AIchat.sidebar.newChat")}
        </button>

        {chatList.map((chat) => (
          <button
            key={chat.id}
            className={`${s.sidebarBtn} ${selectedChat === chat.id ? s.active : ""}`}
            onClick={() => loadChat(chat.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              deleteChat(chat.id);
            }}
          >
            {chat.title}
          </button>
        ))}
      </div>

      {/* Приветственный экран если нет чатов */}
      {chatList.length === 0 ? (
        <div className={s.chatContainer}>
          <h1 className={s.welcomeTitle}>{t("AIchat.welcome.title")}</h1>

          <div className={s.welcomeInputWrapper}>
            <input
              type="text"
              placeholder={t("AIchat.welcome.placeholder")}
              className={s.welcomeInput}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter" && message.trim() && !isLoading) {
                  e.preventDefault();
                  newChat(message);
                }
              }}
            />
            <button
              className={s.welcomeButton}
              disabled={!message.trim() || isLoading}
              onClick={(e) => {
                e.preventDefault();
                if (message.trim()) {
                  newChat(message);
                }
              }}
            >
              ➤
            </button>
          </div>
        </div>
      ) : (
        <div className={s.chatContainer}>
          <h1 className={s.Aititle}>Cognia</h1>

          <div className={s.chatBox} ref={chatBoxRef}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${s.message} ${msg.role === "user" ? s.user : s.ai}`}
              >
                <div className={s.messageAvatar}>
                  {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={s.messageContent}>{msg.text}</div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${s.message} ${s.ai}`}
              >
                <div className={s.messageAvatar}>
                  <Bot size={20} />
                </div>
                <div className={s.messageContent}>{t("AIchat.typing")}</div>
              </motion.div>
            )}
          </div>

          {/* Ввод */}
          <div className={s.AiinputSection}>
            <div className={s.inputWrapper}>
              <textarea
                className={s.Aiinput}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("AIchat.input.placeholder")}
                disabled={isLoading}
              />

              <button
                className={s.AiButton}
                onClick={sendMessage}
                disabled={!message.trim() || isLoading}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChat;