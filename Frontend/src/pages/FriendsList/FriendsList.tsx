import { useEffect, useState } from "react";
import styles from "./FriendsList.module.css";

/* ================== TYPES ================== */

interface Friend {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

interface FriendRequest {
  id: number;
  user: Friend;
  createdAt: string;
}

/* ================== MOCK DATA ================== */

const mockFriends: Friend[] = [
  {
    id: 1,
    name: "Alex",
    email: "alex@mail.com",
    createdAt: "2024-01-10",
  },
  {
    id: 2,
    name: "Maria",
    email: "maria@mail.com",
    createdAt: "2024-02-03",
  },
];

const mockRequests: FriendRequest[] = [
  {
    id: 101,
    user: {
      id: 3,
      name: "John",
      email: "john@mail.com",
      createdAt: "2024-03-01",
    },
    createdAt: "2024-03-05",
  },
];

/* ================== COMPONENT ================== */

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [newFriendId, setNewFriendId] = useState<string>("");

  useEffect(() => {
    // имитация загрузки
    setTimeout(() => {
      setFriends(mockFriends);
      setPendingRequests(mockRequests);
      setLoading(false);
    }, 500);
  }, []);

  /* ================== ACTIONS ================== */

  const addFriend = () => {
    if (!newFriendId.trim()) return;

    alert(`Заявка пользователю с ID ${newFriendId} отправлена`);
    setNewFriendId("");
  };

  const acceptRequest = (friend: Friend) => {
    setFriends((prev) => [...prev, friend]);
    setPendingRequests((prev) =>
      prev.filter((r) => r.user.id !== friend.id)
    );
  };

  const removeFriend = (friendId: number) => {
    if (!confirm("Удалить из друзей?")) return;
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  /* ================== UI ================== */

  if (loading) {
    return (
      <div className={styles["friends-container"]}>
        <div className={styles.loading}>Загрузка друзей...</div>
      </div>
    );
  }

  return (
    <div className={styles["friends-container"]}>
      <div className={styles["friends-header"]}>
        <h2>👥 Друзья</h2>

        <div className={styles["add-friend"]}>
          <input
            type="number"
            placeholder="ID пользователя"
            value={newFriendId}
            onChange={(e) => setNewFriendId(e.target.value)}
            className={styles["friend-id-input"]}
          />
          <button onClick={addFriend} className={styles["add-friend-btn"]}>
            Добавить
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "friends" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("friends")}
        >
          Друзья ({friends.length})
        </button>

        <button
          className={`${styles.tab} ${
            activeTab === "requests" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("requests")}
        >
          Заявки ({pendingRequests.length})
        </button>
      </div>

      {/* ===== FRIENDS ===== */}
      {activeTab === "friends" && (
        <div className={styles["friends-list"]}>
          {friends.length === 0 ? (
            <div className={styles["empty-state"]}>
              У вас пока нет друзей
            </div>
          ) : (
            friends.map((friend) => (
              <div key={friend.id} className={styles["friend-item"]}>
                <div className={styles["friend-info"]}>
                  <h3>{friend.name}</h3>
                  <p>{friend.email}</p>
                  <p>
                    Друзья с{" "}
                    {new Date(friend.createdAt).toLocaleDateString()}
                  </p>
                </div>


                <div className={styles["friend-actions"]}>
                  <button
                    className={styles["message-btn"]}
                    onClick={() =>
                      (window.location.href = `/chat/${friend.id}`)
                    }
                  >
                    💬 Сообщение
                  </button>
                  <button
                    className={styles["remove-btn"]}
                    onClick={() => removeFriend(friend.id)}
                  >
                    ❌ Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== REQUESTS ===== */}
      {activeTab === "requests" && (
        <div className={styles["requests-list"]}>
          {pendingRequests.length === 0 ? (
            <div className={styles["empty-state"]}>
              Нет новых заявок
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className={styles["request-item"]}>
                <div className={styles["friend-info"]}>
                  <h3>{request.user.name}</h3>
                  <p>{request.user.email}</p>
                  <p>
                    Заявка от{" "}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className={styles["request-actions"]}>
                  <button
                    className={styles["accept-btn"]}
                    onClick={() => acceptRequest(request.user)}
                  >
                    ✓ Принять
                  </button>
                  <button
                    className={styles["reject-btn"]}
                    onClick={() =>
                      setPendingRequests((prev) =>
                        prev.filter((r) => r.id !== request.id)
                      )
                    }
                  >
                    ✗ Отклонить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FriendsList;
