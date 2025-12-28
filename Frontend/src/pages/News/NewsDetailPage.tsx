import { useParams, useNavigate } from 'react-router-dom';
import { news } from './data';
import styles from './NewsDetailPage.module.css';

export const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = news.find(n => n.id === id);

  if (!item) {
    return <h2>Новость не найдена</h2>;
  }

  return (
    <article className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        ← Назад
      </button>
      
      {/* КАРТИНКА */}
      <div className={styles.image} />

      {/* КОНТЕНТ */}
      <h1 className={styles.title}>{item.title}</h1>

      <div className={styles.meta}>
        <span className={styles.category}>Новости / {item.category}</span>
      </div>

      <p className={styles.text}>{item.text}</p>
    </article>
  );
};
