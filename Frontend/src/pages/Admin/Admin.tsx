import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  DollarSign,
  Tag,
  FileText,
  Users,
} from 'lucide-react';
import styles from './AdminPanel.module.css';

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

const AdminPanel: React.FC = () => {
  const [privileges, setPrivileges] = useState<Privilege[]>([
    { id: 1, title: 'VIP Статус', description: 'Преміум доступ на 30 днів', price: 500, category: 'VIP', stock: 999, active: true },
    { id: 2, title: 'Premium Pack', description: 'Набір преміум привілегій', price: 750, category: 'Premium', stock: 500, active: true },
    { id: 3, title: 'Starter Pack', description: 'Початковий набір', price: 250, category: 'Basic', stock: 1000, active: true },
    { id: 4, title: 'Elite Access', description: 'Ексклюзивний доступ', price: 1500, category: 'Elite', stock: 50, active: false },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrivilege, setEditingPrivilege] = useState<Privilege | null>(null);
  const [activeTab, setActiveTab] = useState<'privileges' | 'stats'>('privileges');

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

  const handleOpenModal = (privilege?: Privilege) => {
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrivilege(null);
  };

  const handleSave = () => {
    if (editingPrivilege) {
      setPrivileges(privileges.map(p => (p.id === formData.id ? formData : p)));
    } else {
      setPrivileges([...privileges, formData]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (confirm('Ви впевнені, що хочете видалити цю привілегію?')) {
      setPrivileges(privileges.filter(p => p.id !== id));
    }
  };

  const handleToggleActive = (id: number) => {
    setPrivileges(privileges.map(p =>
      p.id === id ? { ...p, active: !p.active } : p
    ));
  };

  const stats = {
    totalRevenue: privileges.reduce((s, p) => s + p.price * (1000 - p.stock), 0),
    totalSales: privileges.reduce((s, p) => s + (1000 - p.stock), 0),
    activePrivileges: privileges.filter(p => p.active).length,
    totalUsers: 1234,
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1>Панель Адміністратора</h1>
          <p>Управління привілеями та магазином</p>
        </div>
      </header>

      <main className={styles.container}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('privileges')}
            className={`${styles.tab} ${activeTab === 'privileges' ? styles.activeTab : ''}`}
          >
            Привілегії
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`${styles.tab} ${activeTab === 'stats' ? styles.activeTab : ''}`}
          >
            Статистика
          </button>
        </div>

        {/* Stats */}
        {activeTab === 'stats' && (
          <div className={styles.statsGrid}>
            <StatCard title="Загальний дохід" value={`${stats.totalRevenue} ОХО`} icon={<DollarSign />} />
            <StatCard title="Продажі" value={stats.totalSales} icon={<Tag />} />
            <StatCard title="Активні привілегії" value={stats.activePrivileges} icon={<FileText />} />
            <StatCard title="Користувачі" value={stats.totalUsers} icon={<Users />} />
          </div>
        )}

        {/* Privileges */}
        {activeTab === 'privileges' && (
          <>
            <div className={styles.toolbar}>
              <h2>Всі привілегії ({privileges.length})</h2>
              <button onClick={() => handleOpenModal()} className={styles.addButton}>
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
                    <th />
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
                      <td>{p.price} ОХО</td>
                      <td>{p.stock}</td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(p.id)}
                          className={`${styles.status} ${p.active ? styles.active : styles.inactive}`}
                        >
                          {p.active ? 'Активна' : 'Неактивна'}
                        </button>
                      </td>
                      <td className={styles.actions}>
                        <button onClick={() => handleOpenModal(p)}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingPrivilege ? 'Редагувати привілегію' : 'Додати привілегію'}</h3>
              <button onClick={handleCloseModal}>
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
              <button onClick={handleCloseModal}>Скасувати</button>
              <button onClick={handleSave} className={styles.save}>
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

const StatCard = ({ title, value, icon }: any) => (
  <div className={styles.statCard}>
    <div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
    {icon}
  </div>
);

export default AdminPanel;
