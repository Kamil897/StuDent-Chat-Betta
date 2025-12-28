import styles from './NewsSection.module.css';
import type { NewsItem } from '../../pages/News/data';
import { NewsCard } from '../NewsCard/NewsCard';
import { Link } from 'react-router-dom';

type Props = {
  title: string;
  items: NewsItem[];
  variant?: 'world' | 'student' | 'sidebar';
};

export const NewsSection = ({
  title,
  items,
  variant = 'world',
}: Props) => {
  if (!items.length) return null;

  const TOP_COUNT = 2;

  const topItems =
    variant === 'world' ? items.slice(0, TOP_COUNT) : items;

  const feedItems =
    variant === 'world' ? items.slice(TOP_COUNT) : [];

  return (
    <section
      className={`${styles.section} ${
        variant === 'world' ? styles.worldSection : ''
      }`}
    >
      <h2 className={styles.title}>{title}</h2>

      <div
        className={`${styles.grid} ${
            variant === 'sidebar' ? styles.sidebarGrid : ''
        }`}
        >
        {topItems.map(item => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>

      {variant === 'world' && (
        <ul className={styles.feed}>
          {feedItems.map(item => (
            <li key={item.id} className={styles.feedItem}>
              <Link to={`/news/${item.id}`} className={styles.feedLink}>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      
    </section>
  );
};
