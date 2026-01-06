import styles from './News.module.css';
import { news } from './data';
import { NewsSection } from '../../Components/NewsSection/NewsSection';

const News = () => {
  return (
    <main className={styles.page}>
      {/* ЛЕВАЯ КОЛОНКА */}
      <div className={styles.main}>
        <NewsSection
          title="Мир"
          items={news.filter(n => n.category === 'world')}
          variant="world"
        />

        <span className={styles.line}></span>

        <NewsSection
          title="Student-chat"
          items={news.filter(n => n.category === 'student')}
          variant="student"
        />
      </div>


      {/* ПРАВАЯ КОЛОНКА */}
      <aside className={styles.sidebar}>
      <NewsSection
        title="Бизнес"
        items={news.filter(n => n.category === 'business')}
        variant="sidebar"
      />

      <span className={styles.line}></span>

      <NewsSection
        title="Искусство"
        items={news.filter(n => n.category === 'art')}
        variant="sidebar"
      />

      </aside>
    </main>
  );
};

export default News;










