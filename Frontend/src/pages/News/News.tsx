import { useEffect, useState } from 'react';
import styles from './News.module.css';
import { news } from './data';
import { NewsSection } from '../../Components/NewsSection/NewsSection';
import { getAllNewsItems, getNewsByCategory, getFeaturedNews, incrementNewsViews } from '../../utils/newsAdmin';
import type { NewsItem } from './data';

const News = () => {
  const [adminNews, setAdminNews] = useState<NewsItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    // Load news from admin storage
    const adminItems = getAllNewsItems();
    const featured = getFeaturedNews();
    
    setAdminNews(adminItems);
    setFeaturedNews(featured);
    
    // Listen for news updates (from admin panel)
    const handleNewsUpdate = () => {
      setAdminNews(getAllNewsItems());
      setFeaturedNews(getFeaturedNews());
    };
    
    window.addEventListener('news-updated', handleNewsUpdate);
    
    return () => {
      window.removeEventListener('news-updated', handleNewsUpdate);
    };
  }, []);

  // Merge admin news with default news (admin news takes priority)
  const getMergedNews = (category: NewsItem['category']) => {
    const defaultNews = news.filter(n => n.category === category);
    const adminCategoryNews = adminNews.filter(n => n.category === category);
    
    // Combine and remove duplicates by title
    const merged = [...adminCategoryNews];
    defaultNews.forEach(item => {
      if (!merged.find(n => n.title === item.title)) {
        merged.push(item);
      }
    });
    
    // Sort by publishedAt (newest first)
    return merged.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
  };

  // Track views when news item is clicked
  const handleNewsClick = (item: NewsItem) => {
    if (item.id && adminNews.find(n => n.id === item.id)) {
      incrementNewsViews(item.id);
    }
  };

  return (
    <main className={styles.page}>
      {/* FEATURED NEWS */}
      {featuredNews.length > 0 && (
        <div className={styles.featuredSection}>
          <h2 className={styles.featuredTitle}>⭐ Рекомендуемые новости</h2>
          <NewsSection
            title=""
            items={featuredNews.slice(0, 3)}
            variant="world"
          />
        </div>
      )}

      {/* ЛЕВАЯ КОЛОНКА */}
      <div className={styles.main}>
        <NewsSection
          title="Мир"
          items={getMergedNews('world')}
          variant="world"
        />

        <span className={styles.line}></span>

        <NewsSection
          title="Student-chat"
          items={getMergedNews('student')}
          variant="student"
        />
      </div>

      {/* ПРАВАЯ КОЛОНКА */}
      <aside className={styles.sidebar}>
        <NewsSection
          title="Бизнес"
          items={getMergedNews('business')}
          variant="sidebar"
        />

        <span className={styles.line}></span>

        <NewsSection
          title="Искусство"
          items={getMergedNews('art')}
          variant="sidebar"
        />
      </aside>
    </main>
  );
};

export default News;











