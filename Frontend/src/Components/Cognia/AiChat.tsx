import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import s from "./AiChat.module.scss";

type Chat = {
  id: number;
  title: string;
};

type Message = {
  role: "user" | "ai";
  text: string;
};

const AiChat: React.FC = () => {
  const [chatList, setChatList] = useState<Chat[]>(() => {
    return JSON.parse(localStorage.getItem("chatList") || "[]");
  });

  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  // Автоскролл
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Загрузка сообщений
  const loadChat = (chatId: number) => {
    setSelectedChat(chatId);
    const saved = JSON.parse(localStorage.getItem(`chat_${chatId}`) || "[]");
    setMessages(saved);
  };

  // Создать чат
  const newChat = () => {
    const id = Date.now();

    const newChatObj: Chat = {
      id,
      title: `Chat ${chatList.length + 1}`,
    };

    const updated = [...chatList, newChatObj];
    setChatList(updated);
    localStorage.setItem("chatList", JSON.stringify(updated));

    setSelectedChat(id);
    setMessages([]);
    localStorage.setItem(`chat_${id}`, "[]");
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

  // "AI"-ответ (фейковый)
  const fakeAIReply = async (_userMsg: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const replies = [
          "Интересно, расскажи подробнее!",
          "Хмм, звучит неплохо.",
          "Хороший вопрос 👌",
          "Согласен.",
          "Продолжай.",
        ];
        resolve(replies[Math.floor(Math.random() * replies.length)]);
      }, 800);
    });
  };

  const sendMessage = async () => {
    if (!message.trim() || selectedChat === null) return;

    const userMsg: Message = { role: "user", text: message };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    saveMessages(selectedChat, newMessages);
    setMessage("");

    setIsLoading(true);

    const reply = await fakeAIReply(message);
    const aiMsg: Message = { role: "ai", text: reply };

    const updated = [...newMessages, aiMsg];
    setMessages(updated);
    saveMessages(selectedChat, updated);

    setIsLoading(false);
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
        <h2>💬 Чаты</h2>

        <button onClick={newChat} className={s.newChat}>
          + Новый чат
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
          <h1 className={s.welcomeTitle}>Добро пожаловать!</h1>

          <div className={s.welcomeInputWrapper}>
            <input
              type="text"
              placeholder="Спросите что-нибудь..."
              className={s.welcomeInput}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") newChat();
              }}
            />
            <button className={s.welcomeButton} disabled={!message.trim()}>
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
                <div className={s.messageContent}>Печатает...</div>
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
                placeholder="Введите сообщение..."
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
