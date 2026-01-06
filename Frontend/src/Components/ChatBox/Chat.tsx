import { useState, useEffect, useRef } from "react";
import styles from "./ChatBox.module.scss";
import {
  getChatRooms,
  getMessages,
  saveMessage,
  getCurrentUser,
  createChatRoom,
  addReaction,
  removeReaction,
  parseMentions,
  saveChatRooms,
  deleteChatRoom,
  type ChatRoom,
  type Message,
  type ChatType,
  type ChannelCategory,
} from "../../utils/chatStorage";
import {
  getFriends,
  getMyFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequestByName,
  removeFriend,
  type Friend,
  type FriendRequest,
} from "../../utils/friendsStorage";
import { searchUsers, type SearchableUser } from "../../utils/userSearch";
import { Mic, Paperclip, Smile, Send, Plus, Hash, Users, UserPlus, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  connectChatSocket,
  disconnectChatSocket,
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  onNewMessage,
  offNewMessage,
  sendTypingStart,
  sendTypingStop,
} from "../../utils/chatSocket";

const ChatComponent: React.FC = () => {
  const [sidebarTab, setSidebarTab] = useState<"chats" | "friends">("chats");
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<ChatType>("channel");
  const [newRoomCategory, setNewRoomCategory] = useState<ChannelCategory>("interest");
  const [filterCategory, setFilterCategory] = useState<ChannelCategory | "all">("all");
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [friendsTab, setFriendsTab] = useState<"friends" | "requests">("friends");
  const [newFriendName, setNewFriendName] = useState("");
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const currentUser = getCurrentUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadRooms();
    loadFriends();
    loadFriendRequests();
    
    // Подключаемся к WebSocket для real-time чатов
    connectChatSocket();
    
    // Подписываемся на новые сообщения
    const handleNewMessage = (message: Message) => {
      if (message.chatId === selectedRoomId) {
        saveMessage(message);
        setMessages((prev) => [...prev, message]);
      } else {
        // Show notification for messages in other rooms
        const currentUser = getCurrentUser();
        // Only notify if message is not from current user
        if (message.userId !== currentUser.id) {
          import("../../utils/notifications").then(({ notifyMessage }) => {
            notifyMessage(message.username || "Пользователь", message.text, message.chatId);
          });
        }
      }
    };
    
    onNewMessage(handleNewMessage);
    
    return () => {
      offNewMessage(handleNewMessage);
      // Не отключаемся полностью, так как можем использовать в других местах
    };
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      loadMessages(selectedRoomId);
      // Присоединяемся к комнате через WebSocket
      joinChatRoom(selectedRoomId);
    }
    
    return () => {
      if (selectedRoomId) {
        leaveChatRoom(selectedRoomId);
      }
    };
  }, [selectedRoomId]);

  useEffect(() => {
    // Используем setTimeout для корректного автоскролла после рендера
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const loadRooms = () => {
    const loadedRooms = getChatRooms();
    setRooms(loadedRooms);
    if (loadedRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(loadedRooms[0].id);
    }
  };

  const loadFriends = () => {
    const loadedFriends = getFriends();
    setFriends(loadedFriends);
  };

  const loadFriendRequests = () => {
    // Load only requests for current user
    const loadedRequests = getMyFriendRequests();
    setFriendRequests(loadedRequests);
  };

  const loadMessages = (roomId: string) => {
    const loadedMessages = getMessages(roomId);
    setMessages(loadedMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedRoomId || !currentUser) return;

    const mentions = parseMentions(messageText, [currentUser]); // In real app, get all users

    const message: Message = {
      id: `msg_${Date.now()}`,
      chatId: selectedRoomId,
      userId: currentUser.id,
      username: currentUser.username,
      text: messageText,
      type: "text",
      mentions,
      createdAt: new Date().toISOString(),
    };

    // Сохраняем локально
    saveMessage(message);
    setMessages([...messages, message]);
    setMessageText("");

    // Отправляем через WebSocket для real-time доставки
    sendChatMessage({
      id: message.id,
      chatId: message.chatId,
      userId: message.userId,
      username: message.username,
      text: message.text,
      type: message.type,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoomId || !currentUser) return;

    // In real app, upload file to server and get URL
    // For now, create object URL
    const fileUrl = URL.createObjectURL(file);

    const message: Message = {
      id: `msg_${Date.now()}`,
      chatId: selectedRoomId,
      userId: currentUser.id,
      username: currentUser.username,
      text: `📎 ${file.name}`,
      type: "file",
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      createdAt: new Date().toISOString(),
    };

    saveMessage(message);
    setMessages([...messages, message]);
  };

  const handleVoiceRecord = async () => {
    if (!selectedRoomId || !currentUser) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const fileUrl = URL.createObjectURL(blob);

        const message: Message = {
          id: `msg_${Date.now()}`,
          chatId: selectedRoomId,
          userId: currentUser.id,
          username: currentUser.username,
          text: "🎤 Голосовое сообщение",
          type: "voice",
          fileUrl,
          fileName: "voice.webm",
          fileType: "audio/webm",
          createdAt: new Date().toISOString(),
        };

        saveMessage(message);
        setMessages([...messages, message]);
      };

      recorder.start();
      setTimeout(() => {
        recorder.stop();
        stream.getTracks().forEach((track) => track.stop());
      }, 5000); // 5 seconds max
    } catch (error) {
      console.error("Error recording voice:", error);
      alert("Не удалось записать голосовое сообщение");
    }
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;

    const room = createChatRoom(newRoomName, newRoomType, newRoomCategory);
    setRooms([...rooms, room]);
    setSelectedRoomId(room.id);
    setShowCreateRoom(false);
    setNewRoomName("");
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!selectedRoomId || !currentUser) return;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const hasReaction = message.reactions?.[emoji]?.includes(currentUser.id);

    if (hasReaction) {
      removeReaction(selectedRoomId, messageId, emoji, currentUser.id);
    } else {
      addReaction(selectedRoomId, messageId, emoji, currentUser.id);
    }

    loadMessages(selectedRoomId);
  };

  // Friends functions
  const handleStartChatWithFriend = (friend: Friend) => {
    if (!currentUser) return;

    // Find or create direct chat with friend
    // Check by member IDs
    let directRoom = rooms.find(
      (r) => r.type === "direct" && 
      r.members.includes(friend.id) && 
      r.members.includes(currentUser.id) &&
      r.members.length === 2
    );

    if (!directRoom) {
      // Create new direct chat room
      directRoom = createChatRoom(friend.name, "direct");
      directRoom.members = [currentUser.id, friend.id];
      const updatedRooms = [...rooms, directRoom];
      setRooms(updatedRooms);
      saveChatRooms(updatedRooms);
    }

    setSelectedRoomId(directRoom.id);
    setSidebarTab("chats");
    loadMessages(directRoom.id);
  };

  const handleSearchFriend = async (query: string) => {
    setNewFriendName(query);
    if (query.trim().length >= 2) {
      const results = await searchUsers(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSelectFriend = (user: SearchableUser) => {
    setNewFriendName(user.name || user.username);
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleAddFriend = async () => {
    if (!newFriendName.trim()) return;
    
    const result = await sendFriendRequestByName(newFriendName);
    if (result) {
      showNotification(`Заявка пользователю "${newFriendName}" отправлена!`, "success");
      setNewFriendName("");
      setSearchResults([]);
      setShowSearchResults(false);
      loadFriendRequests();
    } else {
      showNotification(`Пользователь "${newFriendName}" не найден или заявка уже существует`, "error");
    }
  };
  
  const showNotification = (message: string, _type: "success" | "error") => {
    // Simple notification - can be improved with a toast library
    alert(message);
  };

  const handleAcceptRequest = async (requestId: string) => {
    const friend = await acceptFriendRequest(requestId);
    if (friend) {
      loadFriends();
      loadFriendRequests();
      showNotification(`Вы приняли заявку от "${friend.name}"!`, "success");
      // Create direct chat room with new friend
      handleStartChatWithFriend(friend);
      // Notification is already added in acceptFriendRequest function
    }
  };

  const handleRejectRequest = (requestId: string) => {
    const request = friendRequests.find(r => r.id === requestId);
    rejectFriendRequest(requestId);
    loadFriendRequests();
    if (request) {
      showNotification(`Заявка от "${request.fromUserName}" отклонена`, "error");
    }
  };

  const handleRemoveFriend = (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!confirm(`Удалить "${friend?.name || 'друга'}" из друзей?`)) return;
    removeFriend(friendId);
    loadFriends();
    if (friend) {
      showNotification(`"${friend.name}" удален из друзей`, "error");
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (filterCategory === "all") return true;
    return room.category === filterCategory;
  });

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const categoryLabels: Record<ChannelCategory | "all", string> = {
    all: "chat.createRoom.category.all",
    subject: "chat.createRoom.category.subject",
    university: "chat.createRoom.category.university",
    country: "chat.createRoom.category.country",
    interest: "chat.createRoom.category.interest",
  };

  const commonReactions = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

  return (
    <div className={styles.chatWrapper}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        {/* Sidebar tabs */}
        <div className={styles.sidebarTabs}>
          <button
            className={`${styles.sidebarTab} ${sidebarTab === "chats" ? styles.active : ""}`}
            onClick={() => setSidebarTab("chats")}
          >
            <MessageCircle size={18} />
            {t("chat.tabs.chats")}
          </button>
          <button
            className={`${styles.sidebarTab} ${sidebarTab === "friends" ? styles.active : ""}`}
            onClick={() => setSidebarTab("friends")}
          >
            <Users size={18} />
            {t("chat.tabs.friends")}
            {friendRequests.length > 0 && (
              <span className={styles.badge}>{friendRequests.length}</span>
            )}
          </button>
        </div>

        {/* Chats tab */}
        {sidebarTab === "chats" && (
          <>
            <div className={styles.sidebarHeader}>
              <h2>{t("chat.tabs.chats")}</h2>
              <button
                className={styles.newRoomButton}
                onClick={() => setShowCreateRoom(!showCreateRoom)}
                title="Создать комнату"
              >
                <Plus size={20} />
              </button>
            </div>

        {showCreateRoom && (
          <div className={styles.createRoomForm}>
            <input
              type="text"
              placeholder={t("chat.createRoom.namePlaceholder")}
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className={styles.input}
            />
            <select
              value={newRoomType}
              onChange={(e) => setNewRoomType(e.target.value as ChatType)}
              className={styles.select}
            >
                <option value="channel">{t("chat.createRoom.type.channel")}</option>
                <option value="group">{t("chat.createRoom.type.group")}</option>
                <option value="direct">{t("chat.createRoom.type.direct")}</option>
            </select>
            {newRoomType === "channel" && (
              <select
                value={newRoomCategory}
                onChange={(e) => setNewRoomCategory(e.target.value as ChannelCategory)}
                className={styles.select}
              >
                <option value="subject">{t("chat.createRoom.category.subject")}</option>
                <option value="university">{t("chat.createRoom.category.university")}</option>
                <option value="country">{t("chat.createRoom.category.country")}</option>
                <option value="interest">{t("chat.createRoom.category.interest")}</option>
              </select>
            )}
            <div className={styles.createRoomActions}>
              <button onClick={handleCreateRoom} className={styles.createButton}>
              {t("chat.createRoom.create")}
              </button>
              <button
                onClick={() => setShowCreateRoom(false)}
                className={styles.cancelButton}
              >
                {t("chat.createRoom.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Category filters */}
        <div className={styles.categoryFilters}>
          {(["all", "subject", "university", "country", "interest"] as const).map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryFilter} ${
                filterCategory === cat ? styles.active : ""
              }`}
              onClick={() => setFilterCategory(cat)}
            >
              {t(categoryLabels[cat])}
          </button>
        ))}
      </div>

        {/* Rooms list */}
        <div className={styles.roomsList}>
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className={`${styles.roomItem} ${
                selectedRoomId === room.id ? styles.active : ""
              }`}
            >
              <button
                className={styles.roomButton}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <span className={styles.roomIcon}>
                  {room.icon || (room.type === "channel" ? <Hash size={18} /> : "💬")}
                </span>
                <div className={styles.roomInfo}>
                  <div className={styles.roomName}>{room.name}</div>
                  {room.description && (
                    <div className={styles.roomDescription}>{room.description}</div>
                  )}
                </div>
              </button>
              <button
                className={styles.deleteRoomButton}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Удалить чат "${room.name}"? Все сообщения будут удалены.`)) {
                    deleteChatRoom(room.id);
                    loadRooms();
                    if (selectedRoomId === room.id) {
                      setSelectedRoomId(null);
                      setMessages([]);
                    }
                  }
                }}
                title="Удалить чат"
              >
                ✕
              </button>
            </div>
            ))}
          </div>
          </>
        )}

        {/* Friends tab */}
        {sidebarTab === "friends" && (
          <>
            <div className={styles.sidebarHeader}>
              <h2>{t("chat.friends.addFriend")}</h2>
              <button
                className={styles.newRoomButton}
                onClick={() => setShowCreateRoom(!showCreateRoom)}
                title="Добавить друга"
              >
                <UserPlus size={20} />
              </button>
            </div>

            {showCreateRoom && (
              <div className={styles.createRoomForm}>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Введите имя или username пользователя"
                    value={newFriendName}
                    onChange={(e) => handleSearchFriend(e.target.value)}
                    onFocus={() => {
                      if (newFriendName.trim().length >= 2) {
                        setShowSearchResults(true);
                      }
                    }}
                    className={styles.input}
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className={styles.searchResults}>
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className={styles.searchResultItem}
                          onClick={() => handleSelectFriend(user)}
                        >
                          <div className={styles.searchResultAvatar}>
                            {user.avatarSeed ? (
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed}`}
                                alt={user.name}
                              />
                            ) : (
                              <div className={styles.avatarPlaceholder}>
                                {user.name[0]?.toUpperCase() || user.username[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className={styles.searchResultInfo}>
                            <div className={styles.searchResultName}>{user.name}</div>
                            <div className={styles.searchResultUsername}>@{user.username}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.createRoomActions}>
                  <button onClick={handleAddFriend} className={styles.createButton}>
                    {t("chat.friends.sendRequest")}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateRoom(false);
                      setNewFriendName("");
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className={styles.cancelButton}
                  >
                    {t("chat.createRoom.cancel")}
                  </button>
                </div>
              </div>
            )}

            {/* Friends tabs */}
            <div className={styles.categoryFilters}>
              <button
                className={`${styles.categoryFilter} ${
                  friendsTab === "friends" ? styles.active : ""
                }`}
                onClick={() => setFriendsTab("friends")}
              >
                {t("chat.tabs.friends")} ({friends.length})
              </button>
              <button
                className={`${styles.categoryFilter} ${
                  friendsTab === "requests" ? styles.active : ""
                }`}
                onClick={() => setFriendsTab("requests")}
              >
                {t("chat.friends.requests")} ({friendRequests.length})
              </button>
            </div>

            {/* Friends list */}
            {friendsTab === "friends" && (
              <div className={styles.friendsList}>
                {friends.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>{t("chat.friends.empty")}</p>
                    <p className={styles.emptyHint}>
                      {t("chat.friends.hint")}
                    </p>
                  </div>
                ) : (
                  friends.map((friend) => {
                    // Get avatar from avatarSeed if available, otherwise use friend.avatar or default
                    const getFriendAvatar = () => {
                      if (friend.avatarSeed) {
                        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.avatarSeed}`;
                      }
                      if (friend.avatar) {
                        return friend.avatar;
                      }
                      return null;
                    };
                    
                    const avatarUrl = getFriendAvatar();
                    
                    return (
                    <div key={friend.id} className={styles.friendItem}>
                      <div className={styles.friendAvatar}>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={friend.name} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {friend.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={styles.friendInfo}>
                        <div className={styles.friendName}>{friend.name}</div>
                        <div className={styles.friendEmail}>{friend.email}</div>
                      </div>
                      <div className={styles.friendActions}>
                        <button
                          className={styles.messageFriendButton}
                          onClick={() => handleStartChatWithFriend(friend)}
                          title={t("chat.friends.message")}
                        >
                          <MessageCircle size={18} />
                        </button>
                        <button
                          className={styles.removeFriendButton}
                          onClick={() => handleRemoveFriend(friend.id)}
                          title={t("chat.friends.remove")}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Friend requests list */}
            {friendsTab === "requests" && (
              <div className={styles.friendsList}>
                {friendRequests.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>{t("chat.friends.requestsEmpty")}</p>
                  </div>
                ) : (
                  friendRequests.map((request) => (
                    <div key={request.id} className={styles.friendItem}>
                      <div className={styles.friendAvatar}>
                        <div className={styles.avatarPlaceholder}>
                          {request.fromUserName[0].toUpperCase()}
                        </div>
                      </div>
                      <div className={styles.friendInfo}>
                        <div className={styles.friendName}>{request.fromUserName}</div>
                        <div className={styles.friendEmail}>{request.fromUserId}</div>
                        <div className={styles.requestDate}>
                          {new Date(request.createdAt).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                      <div className={styles.friendActions}>
                        <button
                          className={styles.acceptButton}
                          onClick={() => handleAcceptRequest(request.id)}
                          title={t("chat.friends.accept")}
                        >
                          ✓
                        </button>
                        <button
                          className={styles.rejectButton}
                          onClick={() => handleRejectRequest(request.id)}
                          title={t("chat.friends.reject")}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat area */}
      <div className={styles.chatArea}>
        {selectedRoom ? (
          <>
            {/* Chat header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderInfo}>
                <span className={styles.chatIcon}>
                  {selectedRoom.icon || (selectedRoom.type === "channel" ? <Hash size={20} /> : "💬")}
                </span>
                <div>
                  <h3 className={styles.chatTitle}>{selectedRoom.name}</h3>
                  {selectedRoom.description && (
                    <p className={styles.chatDescription}>{selectedRoom.description}</p>
                  )}
                </div>
              </div>
              {selectedRoom.type === "group" && (
                <div className={styles.membersCount}>
                  {selectedRoom.members.length} {t("chat.chatArea.members")}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
              {messages.length === 0 ? (
                <div className={styles.emptyChat}>
                  <p>{t("chat.chatArea.noRoomSelectedHint")}</p>
                </div>
              ) : (
                <div className={styles.messagesList}>
                  {messages.map((message) => {
                    const isOwn = message.userId === currentUser?.id;
                    const hasMentions = message.mentions && message.mentions.length > 0;
                    const isMentioned =
                      hasMentions && message.mentions?.includes(currentUser?.id || "");

                    return (
                      <div
                        key={message.id}
                        className={`${styles.message} ${isOwn ? styles.own : styles.other} ${
                          isMentioned ? styles.mentioned : ""
                        }`}
                      >
                        {!isOwn && (
                          <div className={styles.messageAvatar}>
                            {currentUser?.avatar ? (
                              <img src={currentUser.avatar} alt={message.username} />
                            ) : (
                              <div className={styles.avatarPlaceholder}>
                                {message.username[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={styles.messageContent}>
                          {!isOwn && (
                            <div className={styles.messageUsername}>{message.username}</div>
                          )}
                          {message.type === "file" && message.fileUrl ? (
                            <div className={styles.fileMessage}>
                              {message.fileType?.startsWith("image/") ? (
                                <img
                                  src={message.fileUrl}
                                  alt={message.fileName}
                                  className={styles.fileImage}
                                />
                              ) : (
                                <a
                                  href={message.fileUrl}
                                  download={message.fileName}
                                  className={styles.fileLink}
                                >
                                  📎 {message.fileName}
                                </a>
                              )}
                            </div>
                          ) : message.type === "voice" && message.fileUrl ? (
                            <div className={styles.voiceMessage}>
                              <audio controls src={message.fileUrl} className={styles.audioPlayer} />
                            </div>
                          ) : (
                            <div className={styles.messageText}>
                              {message.text.split(" ").map((word: string, i: number) => {
                                if (word.startsWith("@")) {
                                  return (
                                    <span key={i} className={styles.mention}>
                                      {word}
                                    </span>
                                  );
                                }
                                return <span key={i}>{word} </span>;
                              })}
                            </div>
                          )}
                          <div className={styles.messageFooter}>
                            <span className={styles.messageTime}>
                              {new Date(message.createdAt).toLocaleTimeString("ru-RU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {message.reactions && Object.keys(message.reactions).length > 0 && (
                              <div className={styles.reactions}>
                                {Object.entries(message.reactions).map(([emoji, userIds]) => {
                                  const userIdsArray = userIds as string[];
                                  return (
                                    <button
                                      key={emoji}
                                      className={`${styles.reactionButton} ${
                                        userIdsArray.includes(currentUser?.id || "") ? styles.active : ""
                                      }`}
                                      onClick={() => handleReaction(message.id, emoji)}
                                      title={`${userIdsArray.length} ${userIdsArray.includes(currentUser?.id || "") ? "(вы)" : ""}`}
                                    >
                                      {emoji} {userIdsArray.length}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.messageActions}>
                          <button
                            className={styles.reactionTrigger}
                            onClick={() =>
                              setShowReactions(
                                showReactions === message.id ? null : message.id
                              )
                          }
                          >
                            <Smile size={16} />
                          </button>
                          {showReactions === message.id && (
                            <div className={styles.reactionsPicker}>
                              {commonReactions.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    handleReaction(message.id, emoji);
                                    setShowReactions(null);
                                  }}
                                  className={styles.reactionEmoji}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <div className={styles.messageInput}>
              <button
                className={styles.inputButton}
                onClick={() => fileInputRef.current?.click()}
                title={t("chat.chatArea.fileTooltip")}
              >
                <Paperclip size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <button
                className={styles.inputButton}
                onClick={handleVoiceRecord}
                title={t("chat.chatArea.voiceTooltip")}
              >
                <Mic size={20} />
              </button>
              <textarea
                className={styles.messageTextarea}
                placeholder="Написать сообщение..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
              />
              <button
                className={styles.sendButton}
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noRoomSelected}>
            <h3>{t("chat.chatArea.noRoomSelected")}</h3>
            <p>{t("chat.chatArea.noRoomSelectedHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;