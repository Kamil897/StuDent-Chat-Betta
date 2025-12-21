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
  type ChatRoom,
  type Message,
  type ChatType,
  type ChannelCategory,
} from "../../utils/chatStorage";
import {
  getFriends,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
  removeFriend,
  type Friend,
  type FriendRequest,
} from "../../utils/friendsStorage";
import { Mic, Paperclip, Smile, Send, Plus, Hash, Users, UserPlus, MessageCircle } from "lucide-react";

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
  const [newFriendId, setNewFriendId] = useState("");

  const currentUser = getCurrentUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    loadRooms();
    loadFriends();
    loadFriendRequests();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      loadMessages(selectedRoomId);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    scrollToBottom();
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
    const loadedRequests = getFriendRequests();
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

    saveMessage(message);
    setMessages([...messages, message]);
    setMessageText("");
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
    let directRoom = rooms.find(
      (r) => r.type === "direct" && r.members.includes(friend.id)
    );

    if (!directRoom) {
      directRoom = createChatRoom(friend.name, "direct");
      directRoom.members = [currentUser.id, friend.id];
      const updatedRooms = [...rooms, directRoom];
      setRooms(updatedRooms);
      saveChatRooms(updatedRooms);
    }

    setSelectedRoomId(directRoom.id);
    setSidebarTab("chats");
  };

  const handleAddFriend = () => {
    if (!newFriendId.trim()) return;
    sendFriendRequest(newFriendId, `User ${newFriendId}`);
    alert(`Заявка пользователю ${newFriendId} отправлена`);
    setNewFriendId("");
    loadFriendRequests();
  };

  const handleAcceptRequest = (requestId: string) => {
    const friend = acceptFriendRequest(requestId);
    if (friend) {
      loadFriends();
      loadFriendRequests();
      // Create direct chat room with new friend
      handleStartChatWithFriend(friend);
    }
  };

  const handleRejectRequest = (requestId: string) => {
    rejectFriendRequest(requestId);
    loadFriendRequests();
  };

  const handleRemoveFriend = (friendId: string) => {
    if (!confirm("Удалить из друзей?")) return;
    removeFriend(friendId);
    loadFriends();
  };

  const filteredRooms = rooms.filter((room) => {
    if (filterCategory === "all") return true;
    return room.category === filterCategory;
  });

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const categoryLabels: Record<ChannelCategory | "all", string> = {
    all: "Все",
    subject: "Предметы",
    university: "Вузы",
    country: "Страны",
    interest: "Интересы",
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
            Чаты
          </button>
          <button
            className={`${styles.sidebarTab} ${sidebarTab === "friends" ? styles.active : ""}`}
            onClick={() => setSidebarTab("friends")}
          >
            <Users size={18} />
            Друзья
            {friendRequests.length > 0 && (
              <span className={styles.badge}>{friendRequests.length}</span>
            )}
          </button>
        </div>

        {/* Chats tab */}
        {sidebarTab === "chats" && (
          <>
            <div className={styles.sidebarHeader}>
              <h2>Чаты</h2>
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
              placeholder="Название комнаты"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className={styles.input}
            />
            <select
              value={newRoomType}
              onChange={(e) => setNewRoomType(e.target.value as ChatType)}
              className={styles.select}
            >
              <option value="channel">Канал</option>
              <option value="group">Группа</option>
              <option value="direct">Личный чат</option>
            </select>
            {newRoomType === "channel" && (
              <select
                value={newRoomCategory}
                onChange={(e) => setNewRoomCategory(e.target.value as ChannelCategory)}
                className={styles.select}
              >
                <option value="subject">Предмет</option>
                <option value="university">Вуз</option>
                <option value="country">Страна</option>
                <option value="interest">Интерес</option>
              </select>
            )}
            <div className={styles.createRoomActions}>
              <button onClick={handleCreateRoom} className={styles.createButton}>
                Создать
              </button>
              <button
                onClick={() => setShowCreateRoom(false)}
                className={styles.cancelButton}
              >
                Отмена
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
              {categoryLabels[cat]}
          </button>
        ))}
      </div>

        {/* Rooms list */}
        <div className={styles.roomsList}>
          {filteredRooms.map((room) => (
            <button
              key={room.id}
              className={`${styles.roomButton} ${
                selectedRoomId === room.id ? styles.active : ""
              }`}
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
            ))}
          </div>
          </>
        )}

        {/* Friends tab */}
        {sidebarTab === "friends" && (
          <>
            <div className={styles.sidebarHeader}>
              <h2>Друзья</h2>
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
                <input
                  type="text"
                  placeholder="ID или имя пользователя"
                  value={newFriendId}
                  onChange={(e) => setNewFriendId(e.target.value)}
                  className={styles.input}
                />
                <div className={styles.createRoomActions}>
                  <button onClick={handleAddFriend} className={styles.createButton}>
                    Отправить заявку
                  </button>
                  <button
                    onClick={() => setShowCreateRoom(false)}
                    className={styles.cancelButton}
                  >
                    Отмена
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
                Друзья ({friends.length})
              </button>
              <button
                className={`${styles.categoryFilter} ${
                  friendsTab === "requests" ? styles.active : ""
                }`}
                onClick={() => setFriendsTab("requests")}
              >
                Заявки ({friendRequests.length})
              </button>
            </div>

            {/* Friends list */}
            {friendsTab === "friends" && (
              <div className={styles.friendsList}>
                {friends.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>У вас пока нет друзей</p>
                    <p className={styles.emptyHint}>
                      Добавьте друзей, чтобы начать общение
                    </p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.id} className={styles.friendItem}>
                      <div className={styles.friendAvatar}>
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.name} />
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
                          title="Написать сообщение"
                        >
                          <MessageCircle size={18} />
                        </button>
                        <button
                          className={styles.removeFriendButton}
                          onClick={() => handleRemoveFriend(friend.id)}
                          title="Удалить из друзей"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Friend requests list */}
            {friendsTab === "requests" && (
              <div className={styles.friendsList}>
                {friendRequests.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Нет новых заявок</p>
                  </div>
                ) : (
                  friendRequests.map((request) => (
                    <div key={request.id} className={styles.friendItem}>
                      <div className={styles.friendAvatar}>
                        {request.user.avatar ? (
                          <img src={request.user.avatar} alt={request.user.name} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {request.user.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={styles.friendInfo}>
                        <div className={styles.friendName}>{request.user.name}</div>
                        <div className={styles.friendEmail}>{request.user.email}</div>
                      </div>
                      <div className={styles.friendActions}>
                        <button
                          className={styles.acceptButton}
                          onClick={() => handleAcceptRequest(request.id)}
                          title="Принять"
                        >
                          ✓
                        </button>
                        <button
                          className={styles.rejectButton}
                          onClick={() => handleRejectRequest(request.id)}
                          title="Отклонить"
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
                  {selectedRoom.members.length} участников
                </div>
              )}
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
              {messages.length === 0 ? (
                <div className={styles.emptyChat}>
                  <p>Нет сообщений. Начните общение!</p>
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
                              {message.text.split(" ").map((word, i) => {
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
                                {Object.entries(message.reactions).map(([emoji, userIds]) => (
                                  <button
                                    key={emoji}
                                    className={`${styles.reactionButton} ${
                                      userIds.includes(currentUser?.id || "") ? styles.active : ""
                                    }`}
                                    onClick={() => handleReaction(message.id, emoji)}
                                    title={`${userIds.length} ${userIds.includes(currentUser?.id || "") ? "(вы)" : ""}`}
                                  >
                                    {emoji} {userIds.length}
                                  </button>
                                ))}
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
                title="Прикрепить файл"
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
                title="Голосовое сообщение"
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
            <h3>Выберите чат для начала общения</h3>
            <p>Создайте новую комнату или выберите существующую</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;