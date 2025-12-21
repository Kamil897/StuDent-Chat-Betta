import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  FileText,
  Users,
  MessageSquare,
  Coins,
  Shield,
  Search,
  TrendingUp,
} from 'lucide-react';
import styles from './AdminPanel.module.css';
import { getLeaderboardUsers, updateUserPoints, type LeaderboardUser } from '../../utils/leaderboard';
import { getPoints, getTransactions, addPoints } from '../../utils/points';
import { getChatRooms, saveChatRooms, getMessages, type ChatRoom, type Message } from '../../utils/chatStorage';

interface Privilege {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  active: boolean;
  imageUrl?: string;
}

type AdminTab = 'users' | 'points' | 'privileges' | 'chats' | 'stats';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Users data
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState<number>(0);
  
  // Privileges data
  const loadPrivileges = (): Privilege[] => {
    try {
      const stored = localStorage.getItem("admin_privileges");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error loading privileges:", e);
    }
    // Default privileges
    return [
      { id: 1, title: 'VIP Статус', description: 'Преміум доступ на 30 днів', price: 500, category: 'VIP', stock: 999, active: true },
      { id: 2, title: 'Premium Pack', description: 'Набір преміум привілегій', price: 750, category: 'Premium', stock: 500, active: true },
      { id: 3, title: 'Starter Pack', description: 'Початковий набір', price: 250, category: 'Basic', stock: 1000, active: true },
      { id: 4, title: 'Elite Access', description: 'Ексклюзивний доступ', price: 1500, category: 'Elite', stock: 50, active: false },
    ];
  };

  const savePrivileges = (privil: Privilege[]) => {
    localStorage.setItem("admin_privileges", JSON.stringify(privil));
  };

  const [privileges, setPrivileges] = useState<Privilege[]>(loadPrivileges());
  
  // Chats data
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [roomMessages, setRoomMessages] = useState<Message[]>([]);
  
  // Modals
  const [isPrivilegeModalOpen, setIsPrivilegeModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [editingPrivilege, setEditingPrivilege] = useState<Privilege | null>(null);
  const [formData, setFormData] = useState<Privilege>({
    id: 0,
    title: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
    active: true,
    imageUrl: '',
  });

  // Load data
  useEffect(() => {
    loadUsers();
    loadChatRooms();
    // Load privileges from localStorage
    const savedPrivileges = loadPrivileges();
    if (savedPrivileges.length > 0) {
      setPrivileges(savedPrivileges);
    }
  }, []);

  const loadUsers = () => {
    const allUsers = getLeaderboardUsers();
    setUsers(allUsers);
  };

  const loadChatRooms = () => {
    const rooms = getChatRooms();
    setChatRooms(rooms);
  };

  const loadRoomMessages = (roomId: string) => {
    const messages = getMessages(roomId);
    setRoomMessages(messages);
  };

  // Filter users
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle user points
  const handleAddPoints = (userId: string) => {
    if (pointsToAdd <= 0) return;
    const user = users.find(u => u.id === userId);
    if (user) {
      const newPoints = user.points + pointsToAdd;
      updateUserPoints(userId, newPoints);
      
      // Also update in localStorage if it's current user
      try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const currentUser = JSON.parse(savedUser);
          if (currentUser.id === userId) {
            const currentPoints = getPoints();
            localStorage.setItem("user_points", (currentPoints + pointsToAdd).toString());
            addPoints(pointsToAdd, "reward", "Admin reward");
          }
        }
      } catch (e) {
        console.error("Error updating user points:", e);
      }
      
      loadUsers();
      setPointsToAdd(0);
      setIsPointsModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleSetPoints = (userId: string, newPoints: number) => {
    if (newPoints < 0) return;
    updateUserPoints(userId, newPoints);
    
    // Also update in localStorage if it's current user
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const currentUser = JSON.parse(savedUser);
        if (currentUser.id === userId) {
          localStorage.setItem("user_points", newPoints.toString());
        }
      }
    } catch (e) {
      console.error("Error setting user points:", e);
    }
    
    loadUsers();
  };

  // Handle privileges
  const handleOpenPrivilegeModal = (privilege?: Privilege) => {
    if (privilege) {
      setFormData(privilege);
      setEditingPrivilege(privilege);
    } else {
      setFormData({
        id: Date.now(),
        title: '',
        description: '',
        price: 0,
        category: '',
        stock: 0,
        active: true,
        imageUrl: '',
      });
      setEditingPrivilege(null);
    }
    setIsPrivilegeModalOpen(true);
  };

  const handleSavePrivilege = () => {
    let updated: Privilege[];
    if (editingPrivilege) {
      updated = privileges.map(p => (p.id === formData.id ? formData : p));
    } else {
      updated = [...privileges, formData];
    }
    setPrivileges(updated);
    savePrivileges(updated);
    setIsPrivilegeModalOpen(false);
    setEditingPrivilege(null);
  };

  const handleDeletePrivilege = (id: number) => {
    if (confirm('Ви впевнені, що хочете видалити цю привілегію?')) {
      const updated = privileges.filter(p => p.id !== id);
      setPrivileges(updated);
      savePrivileges(updated);
    }
  };

  const handleTogglePrivilegeActive = (id: number) => {
    const updated = privileges.map(p =>
      p.id === id ? { ...p, active: !p.active } : p
    );
    setPrivileges(updated);
    savePrivileges(updated);
  };

  // Handle chats
  const handleDeleteRoom = (roomId: string) => {
    if (confirm('Ви впевнені, що хочете видалити цей чат?')) {
      const updatedRooms = chatRooms.filter(r => r.id !== roomId);
      saveChatRooms(updatedRooms);
      setChatRooms(updatedRooms);
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        setRoomMessages([]);
      }
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm('Ви впевнені, що хочете видалити це повідомлення?')) {
      try {
        const stored = localStorage.getItem("chatMessages");
        if (stored) {
          const allMessages: Message[] = JSON.parse(stored);
          const updatedMessages = allMessages.filter(m => m.id !== messageId);
          localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
          loadRoomMessages(selectedRoom!.id);
        }
      } catch (e) {
        console.error("Error deleting message:", e);
      }
    }
  };

  const handleClearRoomMessages = (roomId: string) => {
    if (confirm('Ви впевнені, що хочете видалити всі повідомлення з цього чату?')) {
      try {
        const stored = localStorage.getItem("chatMessages");
        if (stored) {
          const allMessages: Message[] = JSON.parse(stored);
          const updatedMessages = allMessages.filter(m => m.chatId !== roomId);
          localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
          if (selectedRoom?.id === roomId) {
            loadRoomMessages(roomId);
          }
        }
      } catch (e) {
        console.error("Error clearing room messages:", e);
      }
    }
  };

  // Statistics
  const stats = {
    totalUsers: users.length,
    totalPoints: users.reduce((sum, u) => sum + u.points, 0),
    totalChatRooms: chatRooms.length,
    totalMessages: chatRooms.reduce((sum, room) => {
      const messages = getMessages(room.id);
      return sum + messages.length;
    }, 0),
    activePrivileges: privileges.filter(p => p.active).length,
    totalTransactions: getTransactions().length,
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1>Панель Адміністратора</h1>
          <p>Управління системою</p>
        </div>
      </header>

      <main className={styles.container}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('users')}
            className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
          >
            <Users size={18} />
            Користувачі
          </button>
          <button
            onClick={() => setActiveTab('points')}
            className={`${styles.tab} ${activeTab === 'points' ? styles.activeTab : ''}`}
          >
            <Coins size={18} />
            Балли
          </button>
          <button
            onClick={() => setActiveTab('privileges')}
            className={`${styles.tab} ${activeTab === 'privileges' ? styles.activeTab : ''}`}
          >
            <Shield size={18} />
            Привілегії
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`${styles.tab} ${activeTab === 'chats' ? styles.activeTab : ''}`}
          >
            <MessageSquare size={18} />
            Чати
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`${styles.tab} ${activeTab === 'stats' ? styles.activeTab : ''}`}
          >
            <TrendingUp size={18} />
            Статистика
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className={styles.section}>
            <div className={styles.toolbar}>
              <h2>Користувачі ({users.length})</h2>
              <div className={styles.searchBox}>
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Пошук користувачів..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ім'я</th>
                    <th>Email</th>
                    <th>Балли</th>
                    <th>Дата реєстрації</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td className={styles.bold}>{user.name || user.username}</td>
                      <td>{user.email || '-'}</td>
                      <td className={styles.pointsCell}>
                        <span className={styles.pointsBadge}>⭐ {user.points}</span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className={styles.actions}>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsPointsModalOpen(true);
                          }}
                          className={styles.actionButton}
                          title="Додати балли"
                        >
                          <Coins size={16} />
                        </button>
                        <button
                          onClick={() => {
                            const newPoints = prompt(`Встановити балли для ${user.name}:`, user.points.toString());
                            if (newPoints !== null) {
                              handleSetPoints(user.id, parseInt(newPoints) || 0);
                            }
                          }}
                          className={styles.actionButton}
                          title="Встановити балли"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Points Tab */}
        {activeTab === 'points' && (
          <div className={styles.section}>
            <div className={styles.toolbar}>
              <h2>Транзакції баллів</h2>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Тип</th>
                    <th>Сума</th>
                    <th>Джерело</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {getTransactions().slice(0, 100).map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>
                        <span className={styles.badge}>
                          {tx.type === 'game_win' ? '🎮' : tx.type === 'achievement' ? '🏆' : tx.type === 'shop_purchase' ? '🛒' : '🎁'}
                          {tx.type}
                        </span>
                      </td>
                      <td className={tx.amount > 0 ? styles.positive : styles.negative}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </td>
                      <td>{tx.source}</td>
                      <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Privileges Tab */}
        {activeTab === 'privileges' && (
          <div className={styles.section}>
            <div className={styles.toolbar}>
              <h2>Привілегії ({privileges.length})</h2>
              <button onClick={() => handleOpenPrivilegeModal()} className={styles.addButton}>
                <Plus size={18} />
                Додати привілегію
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Назва</th>
                    <th>Опис</th>
                    <th>Категорія</th>
                    <th>Ціна</th>
                    <th>Запас</th>
                    <th>Статус</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {privileges.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td className={styles.bold}>{p.title}</td>
                      <td className={styles.truncate}>{p.description}</td>
                      <td>
                        <span className={styles.badge}>{p.category}</span>
                      </td>
                      <td>{p.price} ⭐</td>
                      <td>{p.stock}</td>
                      <td>
                        <button
                          onClick={() => handleTogglePrivilegeActive(p.id)}
                          className={`${styles.status} ${p.active ? styles.active : styles.inactive}`}
                        >
                          {p.active ? 'Активна' : 'Неактивна'}
                        </button>
                      </td>
                      <td className={styles.actions}>
                        <button onClick={() => handleOpenPrivilegeModal(p)}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeletePrivilege(p.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === 'chats' && (
          <div className={styles.section}>
            <div className={styles.toolbar}>
              <h2>Чати ({chatRooms.length})</h2>
              <button onClick={loadChatRooms} className={styles.refreshButton}>
                Оновити
              </button>
            </div>

            <div className={styles.chatsGrid}>
              <div className={styles.chatsList}>
                <h3>Список чатів</h3>
                {chatRooms.length === 0 ? (
                  <p className={styles.emptyState}>Немає чатів</p>
                ) : (
                  chatRooms.map(room => (
                    <div
                      key={room.id}
                      className={`${styles.chatItem} ${selectedRoom?.id === room.id ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedRoom(room);
                        loadRoomMessages(room.id);
                      }}
                    >
                      <div className={styles.chatInfo}>
                        <h4>{room.name}</h4>
                        <p>{room.type} • {room.members.length} учасників</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(room.id);
                        }}
                        className={styles.deleteButton}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {selectedRoom && (
                <div className={styles.messagesPanel}>
                  <div className={styles.messagesHeader}>
                    <div>
                      <h3>{selectedRoom.name}</h3>
                      <p className={styles.roomInfo}>
                        {selectedRoom.type} • {roomMessages.length} повідомлень
                      </p>
                    </div>
                    <div className={styles.headerActions}>
                      <button
                        onClick={() => handleClearRoomMessages(selectedRoom.id)}
                        className={styles.clearButton}
                        title="Очистити всі повідомлення"
                      >
                        Очистити
                      </button>
                      <button onClick={() => setSelectedRoom(null)}>
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.messagesList}>
                    {roomMessages.length === 0 ? (
                      <p className={styles.emptyState}>Немає повідомлень</p>
                    ) : (
                      roomMessages.map(msg => (
                        <div key={msg.id} className={styles.messageItem}>
                          <div className={styles.messageHeader}>
                            <strong>{msg.username}</strong>
                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className={styles.deleteButton}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className={styles.section}>
            <h2>Статистика системи</h2>
            <div className={styles.statsGrid}>
              <StatCard title="Користувачі" value={stats.totalUsers} icon={<Users />} />
              <StatCard title="Всього баллів" value={`${stats.totalPoints.toLocaleString()} ⭐`} icon={<Coins />} />
              <StatCard title="Чати" value={stats.totalChatRooms} icon={<MessageSquare />} />
              <StatCard title="Повідомлення" value={stats.totalMessages} icon={<FileText />} />
              <StatCard title="Активні привілегії" value={stats.activePrivileges} icon={<Shield />} />
              <StatCard title="Транзакції" value={stats.totalTransactions} icon={<TrendingUp />} />
            </div>
          </div>
        )}
      </main>

      {/* Points Modal */}
      {isPointsModalOpen && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Управління баллами: {selectedUser.name}</h3>
              <button onClick={() => {
                setIsPointsModalOpen(false);
                setSelectedUser(null);
              }}>
                <X />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoBox}>
                <p>Поточні балли: <strong>{selectedUser.points} ⭐</strong></p>
              </div>
              <input
                type="number"
                placeholder="Кількість баллів для додавання"
                value={pointsToAdd || ''}
                onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                min="0"
              />
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => handleSetPoints(selectedUser.id, 0)}
                  className={styles.dangerButton}
                >
                  Скинути до 0
                </button>
                <button
                  onClick={() => {
                    const newPoints = prompt('Встановити нову кількість баллів:', selectedUser.points.toString());
                    if (newPoints !== null) {
                      handleSetPoints(selectedUser.id, parseInt(newPoints) || 0);
                    }
                  }}
                  className={styles.secondaryButton}
                >
                  Встановити вручну
                </button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => {
                setIsPointsModalOpen(false);
                setSelectedUser(null);
              }}>
                Скасувати
              </button>
              <button onClick={() => handleAddPoints(selectedUser.id)} className={styles.save}>
                <Save size={16} />
                Додати балли
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privilege Modal */}
      {isPrivilegeModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingPrivilege ? 'Редагувати привілегію' : 'Додати привілегію'}</h3>
              <button onClick={() => {
                setIsPrivilegeModalOpen(false);
                setEditingPrivilege(null);
              }}>
                <X />
              </button>
            </div>
            <div className={styles.modalBody}>
              <input
                placeholder="Назва"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                placeholder="Опис"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
              <div className={styles.row}>
                <input
                  type="number"
                  placeholder="Ціна"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: +e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Запас"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: +e.target.value })}
                />
              </div>
              <input
                placeholder="Категорія"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                />
                Активна
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => {
                setIsPrivilegeModalOpen(false);
                setEditingPrivilege(null);
              }}>
                Скасувати
              </button>
              <button onClick={handleSavePrivilege} className={styles.save}>
                <Save size={16} />
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className={styles.statCard}>
    <div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
    {icon}
  </div>
);

export default AdminPanel;
