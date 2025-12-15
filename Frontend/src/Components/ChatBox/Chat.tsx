import React, { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ChatBox.module.scss';

/* ================== TYPES ================== */

type Message = {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  createdAt: string;
};

type Friend = {
  id: number;
  name: string;
  avatar?: string;
};

/* ================== MOCK DATA ================== */

const MOCK_FRIENDS: Friend[] = [
  {
    id: 1,
    name: 'Alex',
    avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=alex'
  },
  {
    id: 2,
    name: 'John',
    avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=john'
  }
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    fromUserId: 1,
    toUserId: 999,
    content: 'Привет!',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    fromUserId: 999,
    toUserId: 1,
    content: 'Здарова 👋',
    createdAt: new Date().toISOString()
  }
];

/* ================== COMPONENT ================== */

const ChatBox: React.FC = () => {
  const { friendId } = useParams<{ friendId: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [friend, setFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const CURRENT_USER_ID = 999; // локальный "я"

  /* ================== EFFECTS ================== */

  useEffect(() => {
    if (!friendId) {
      setLoading(false);
      return;
    }

    const id = Number(friendId);

    const foundFriend = MOCK_FRIENDS.find(f => f.id === id) || null;
    setFriend(foundFriend);

    const filteredMessages = MOCK_MESSAGES.filter(
      m => m.fromUserId === id || m.toUserId === id
    );

    setMessages(filteredMessages);
    setLoading(false);
  }, [friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ================== HANDLERS ================== */

  const sendMessage = () => {
    if (!newMessage.trim() || !friend) return;

    const message: Message = {
      id: Date.now(),
      fromUserId: CURRENT_USER_ID,
      toUserId: friend.id,
      content: newMessage,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ================== HELPERS ================== */

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Сегодня';
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера';

    return date.toLocaleDateString();
  };

  /* ================== RENDER ================== */

  if (loading) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.loading}>Загрузка чата...</div>
      </div>
    );
  }

  if (!friend) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.error}>Пользователь не найден</div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      {/* HEADER */}
      <div className={styles.chatHeader}>
        <div className={styles.friendInfo}>
          <div className={styles.friendAvatar}>
            <img src={friend.avatar} alt={friend.name} />
          </div>
          <div className={styles.friendDetails}>
            <h3 className={styles.friendName}>{friend.name}</h3>
            <p className={styles.friendStatus}>В сети</p>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className={styles.messagesContainer}>
        <div className={styles.messagesList}>
          {messages.map((message, index) => {
            const isOwn = message.fromUserId === CURRENT_USER_ID;
            const showDate =
              index === 0 ||
              formatDate(message.createdAt) !==
                formatDate(messages[index - 1].createdAt);

            return (
              <div key={message.id}>
                {showDate && (
                  <div className={styles.dateSeparator}>
                    {formatDate(message.createdAt)}
                  </div>
                )}

                <div
                  className={`${styles.message} ${
                    isOwn ? styles.own : styles.other
                  }`}
                >
                  <div className={styles.messageContent}>
                    <p className={styles.messageText}>{message.content}</p>
                    <span className={styles.messageTime}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className={styles.messageInput}>
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Введите сообщение..."
          className={styles.messageTextarea}
          rows={1}
        />
        <button
          onClick={sendMessage}
          className={styles.sendButton}
          disabled={!newMessage.trim()}
        >
          📤
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
