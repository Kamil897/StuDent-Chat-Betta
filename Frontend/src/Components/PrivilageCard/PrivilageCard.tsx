import React from 'react';
import styles from './PrivilageCard.module.css';

interface PrivilegeCardProps {
  title: string;
  description: string;
  limit: string;
  price: number;
  onBuy?: () => void;
  onBack?: () => void;
}

const PrivilegeCard: React.FC<PrivilegeCardProps> = ({
  title,
  description,
  limit,
  price,
  onBuy,
  onBack,
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>{title}</h2>

        <p className={styles.description}>{description}</p>

        <div className={styles.meta}>
          <span>Лимит: {limit}</span>
          <span className={styles.price}>Цена: {price}₽</span>
        </div>

        <button className={styles.buyButton} onClick={onBuy}>
          Купить
        </button>

        <button className={styles.backButton} onClick={onBack}>
          Назад
        </button>
      </div>
    </div>
  );
};

export default PrivilegeCard;
