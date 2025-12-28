import styles from './NewsCard.module.css';
import type { NewsItem } from '../../pages/News/data';
import { Link } from 'react-router-dom';

type Props = {
  item: NewsItem;
  variant?: 'world' | 'student' | 'sidebar';
};

export const NewsCard = ({ item, variant = 'world' }: Props) => {
  return (
    <Link
      to={`/news/${item.id}`}
      className={`${styles.card} ${styles[variant]}`}
    >
      <div className={styles.image} />

      <div className={styles.content}>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </div>
    </Link>
  );
};
