import s from './NewsHero.module.scss';
import NewsText from '../NewsText/NewsText';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const projectNews = [
  {
    id: 'tech1',
    category: 'news.tech',
    img: '/openday.jpg',
    content: 'news.techText1'
  },
  {
    id: 'culture',
    category: 'news.culture',
    img: '/agile.jpg',
    content: 'news.cultureText'
  },
  {
    id: 'tech2',
    category: 'news.tech',
    img: '/openday.jpg',
    content: 'news.techText2'
  }
];

const generalNews = [
  {
    id: 'society',
    category: 'news.society',
    img: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/BBC_World_News_2022_%28Boxed%29.svg',
    content: 'news.societyText'
  }
];

const NewsHero = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProjectNews, setFilteredProjectNews] = useState(projectNews);
  const [filteredGeneralNews, setFilteredGeneralNews] = useState(generalNews);

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
          t(category).toLowerCase().includes(searchLower) ||
          t(content).toLowerCase().includes(searchLower)
      )
    );

    setFilteredGeneralNews(
      generalNews.filter(
        ({ category, content }) =>
          t(category).toLowerCase().includes(searchLower) ||
          t(content).toLowerCase().includes(searchLower)
      )
    );
  }, [searchTerm, t]);

  const handleSearchChange = (e) => {
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
            placeholder={t('news.search')}
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '12px 40px 12px 16px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '25px',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => (e.target.style.borderColor = '#007bff')}
            onBlur={(e) => (e.target.style.borderColor = '#ddd')}
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
                color: '#999'
              }}
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <div style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
            {t('news.searchResults')}: "<strong>{searchTerm}</strong>"
          </div>
        )}
      </div>

      <div className={`${s.h1} ${s.project}`}>
        <h1 className={s.Text}>{t('news.project')}</h1>
      </div>
      {filteredProjectNews.map(({ id, category, img, content }) => (
        <div key={id}>
          <div className={s.h1}>
            <h2 className={s.Text}>{t(category)}</h2>
          </div>
          <div className={s.new}>
            <NewsText ImgSrc={img} p={t(content)} />
          </div>
        </div>
      ))}

      <div className={`${s.h1} ${s.general}`}>
        <h1 className={s.Text}>{t('news.other')}</h1>
      </div>
      {filteredGeneralNews.map(({ id, category, img, content }) => (
        <div key={id}>
          <div className={s.h1}>
            <h2 className={s.Text}>{t(category)}</h2>
          </div>
          <div className={s.new}>
            <NewsText ImgSrc={img} p={t(content)} />
          </div>
        </div>
      ))}

      {searchTerm &&
        filteredProjectNews.length === 0 &&
        filteredGeneralNews.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <h3>{t('news.notFound')}</h3>
            <p>{t('news.tryAnother')}</p>
          </div>
        )}
    </div>
  );
};

export default NewsHero;
