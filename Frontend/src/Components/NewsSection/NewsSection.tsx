import { useState } from 'react';
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
  const STUDENT_LIMIT = 5;
  const SIDEBAR_LIMIT = 4;

  const [showAll, setShowAll] = useState(false);

  // WORLD
  const topItems =
    variant === 'world' ? items.slice(0, TOP_COUNT) : [];

  const feedItems =
    variant === 'world'
      ? items.slice(TOP_COUNT)
      : [];

  // STUDENT
  const studentItems =
    variant === 'student'
      ? showAll
        ? items
        : items.slice(0, STUDENT_LIMIT)
      : [];

  // SIDEBAR
  const sidebarItems =
    variant === 'sidebar'
      ? showAll
        ? items
        : items.slice(0, SIDEBAR_LIMIT)
      : [];

  return (
    <section
      className={`${styles.section} ${
        variant === 'world' ? styles.worldSection : ''
      }`}
    >
      <h2 className={styles.title}>{title}</h2>

      {/* GRID */}
      <div
        className={`${styles.grid} ${
          variant === 'sidebar' ? styles.sidebarGrid : ''
        }`}
      >
        {variant === 'world' &&
          topItems.map(item => (
            <NewsCard key={item.id} item={item} />
          ))}

        {variant === 'student' &&
          studentItems.map(item => (
            <NewsCard key={item.id} item={item} />
          ))}

        {variant === 'sidebar' &&
          sidebarItems.map(item => (
            <NewsCard key={item.id} item={item} />
          ))}
      </div>

      {/* FEED (WORLD) */}
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

      {/* КНОПКА ДЛЯ STUDENT */}
      {variant === 'student' &&
        !showAll &&
        items.length > STUDENT_LIMIT && (
          <div className={styles.buttonWrapper}>
            <button
              className={styles.customLearnMorebtn}
              onClick={() => setShowAll(true)}
            >
                <span className={styles.buttonText}>Ещё</span>
                <div className={styles.circle}></div>
                <div className={styles.arrow}></div>
            </button>
          </div>
        )}

      {/* КНОПКА ДЛЯ SIDEBAR */}
      {variant === 'sidebar' &&
        !showAll &&
        items.length > SIDEBAR_LIMIT && (
          <div className={styles.buttonWrapper}>
            <button
              className={styles.customLearnMorebtn}
              onClick={() => setShowAll(true)}
              aria-label="Показать ещё"
            >
                <span className={styles.buttonText}>Ещё</span>
                <div className={styles.circle}></div>
                <div className={styles.arrow}></div>
            </button>
          </div>
        )}
    </section>
  );
};
