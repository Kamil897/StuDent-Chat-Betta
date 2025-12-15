import s from './NewsHero.module.css';
import NewsText from '../NewsText/NewsText';
import { useState, useEffect, type ChangeEvent } from 'react';

/* ===== TYPES ===== */
interface NewsItem {
  id: string;
  category: string;
  img: string;
  content: string;
}

/* ===== DATA ===== */
const projectNews: NewsItem[] = [
  {
    id: 'tech1',
    category: 'Tech',
    img: '/openday.jpg',
    content: 'Some tech news content 1',
  },
  {
    id: 'culture',
    category: 'Culture',
    img: '/agile.jpg',
    content: 'Some culture news content',
  },
  {
    id: 'tech2',
    category: 'Tech',
    img: '/openday.jpg',
    content: 'Some tech news content 2',
  },
];

const generalNews: NewsItem[] = [
  {
    id: 'society',
    category: 'Society',
    img: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/BBC_World_News_2022_%28Boxed%29.svg',
    content: 'Some society news content',
  },
];

/* ===== COMPONENT ===== */
const NewsHero: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredProjectNews, setFilteredProjectNews] = useState<NewsItem[]>(projectNews);
  const [filteredGeneralNews, setFilteredGeneralNews] = useState<NewsItem[]>(generalNews);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProjectNews(projectNews);
      setFilteredGeneralNews(generalNews);
      return;
    }

    const searchLower = searchTerm.toLowerCase();

    setFilteredProjectNews(
      projectNews.filter(
        ({ category, content }) =>
          category.toLowerCase().includes(searchLower) ||
          content.toLowerCase().includes(searchLower)
      )
    );

    setFilteredGeneralNews(
      generalNews.filter(
        ({ category, content }) =>
          category.toLowerCase().includes(searchLower) ||
          content.toLowerCase().includes(searchLower)
      )
    );
  }, [searchTerm]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className={s.newspage}>
      <div className={s.searchSection} style={{ margin: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Search news..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '12px 40px 12px 16px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '25px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#007bff')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#999',
              }}
            >
              ×
            </button>
          )}
        </div>

        {searchTerm && (
          <div style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
            Search results: "<strong>{searchTerm}</strong>"
          </div>
        )}
      </div>

      <div className={`${s.h1} ${s.project}`}>
        <h1 className={s.Text}>Project News</h1>
      </div>

      {filteredProjectNews.map(({ id, category, img, content }) => (
        <div key={id}>
          <div className={s.h1}>
            <h2 className={s.Text}>{category}</h2>
          </div>
          <div className={s.new}>
            <NewsText ImgSrc={img} p={content} />
          </div>
        </div>
      ))}

      <div className={`${s.h1} ${s.general}`}>
        <h1 className={s.Text}>Other News</h1>
      </div>

      {filteredGeneralNews.map(({ id, category, img, content }) => (
        <div key={id}>
          <div className={s.h1}>
            <h2 className={s.Text}>{category}</h2>
          </div>
          <div className={s.new}>
            <NewsText ImgSrc={img} p={content} />
          </div>
        </div>
      ))}

      {searchTerm && filteredProjectNews.length === 0 && filteredGeneralNews.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <h3>No results found</h3>
          <p>Try another search term</p>
        </div>
      )}
    </div>
  );
};

export default NewsHero;
