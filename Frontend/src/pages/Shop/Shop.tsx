import React, { useState } from 'react';
import { Search } from 'lucide-react';
import styles from './Shop.module.css';
import PrivilegeCard from '../../Components/PrivilageCard/PrivilageCard';

interface Privilege {
  id: number;
  title: string;
  description: string;
  price: number;
  limit: string;
}

const Shop: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Все');
  const [selectedPrivilege, setSelectedPrivilege] = useState<Privilege | null>(null);

  const privileges: Privilege[] = [
    {
      id: 1,
      title: 'VIP',
      description: 'Полный доступ к возможностям сервера',
      price: 500,
      limit: '30 дней',
    },
    {
      id: 2,
      title: 'Premium',
      description: 'Расширенные возможности',
      price: 300,
      limit: '30 дней',
    },
  ];

  const filters = ['Все', 'Достигнуто (0)', 'Недоступно (0)', 'In demands(1)'];

  // 👉 IF PRODUCT IS SELECTED — SHOW PRODUCT PAGE
  if (selectedPrivilege) {
    return (
      <PrivilegeCard
        title={selectedPrivilege.title}
        description={selectedPrivilege.description}
        limit={selectedPrivilege.limit}
        price={selectedPrivilege.price}
        onBuy={() => alert('Покупка...')}
        onBack={() => setSelectedPrivilege(null)}
      />
    );
  }

  // 👉 OTHERWISE SHOW STORE
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Магазин привілегій</h1>

          <div className={styles.balance}>
            <span>Баланс</span>
            <span>500 ОХО</span>
          </div>
        </div>

        <div className={styles.searchBlock}>
          <div className={styles.searchWrapper}>
            <Search size={20} />
            <input
              placeholder="Поиск привилегий"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.filters}>
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {privileges.map((privilege) => (
            <div
              key={privilege.id}
              className={styles.card}
              onClick={() => setSelectedPrivilege(privilege)}
            >
              <div className={styles.imagePlaceholder}>Image</div>

              <div className={styles.cardContent}>
                <button className={styles.buyButton}>
                  {privilege.title}
                </button>
                <p>{privilege.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;
