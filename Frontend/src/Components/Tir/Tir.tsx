import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { handleGameWin } from '../../utils/gameRewards';
import './Tir.css';

const Tir = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [targets, setTargets] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const intervalRef = useRef<number | null>(null);

  const targetImages = [
    'url(/4_normal.png)',
    'url(/4_normal.png)',
    'url(/4_normal.png)',
  ];

  const generateTargets = () => {
    const newTargets = Array.from({ length: 3 }, () => ({
      id: crypto.randomUUID(),
      x: `${Math.random() * 90}%`,
      y: `${Math.random() * 70}%`,
      image: targetImages[Math.floor(Math.random() * targetImages.length)],
    }));

    setTargets((prev) => [...prev, ...newTargets].slice(-12));
  };

  useEffect(() => {
    if (!isMenuOpen && timeLeft > 0) {
      intervalRef.current = window.setInterval(generateTargets, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isMenuOpen, timeLeft]);

  useEffect(() => {
    if (!isMenuOpen && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Game over - award points based on score
            if (score >= 15) {
              handleGameWin("Tir");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isMenuOpen, timeLeft, score]);

  const resetGame = () => {
    setScore(0);
    setTimeLeft(30);
    setTargets([]);
    setIsMenuOpen(false);
  };

  const handleTargetClick = (id: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
    setScore((prev) => prev + 1);
  };

  return (
    <div className="tir">
      {isMenuOpen ? (
        <div className="menu">
          <h1>{t('tir.title')}</h1>
          <button onClick={resetGame}>{t('tir.play')}</button>
          <button onClick={() => navigate('/Games')}>
            {t('tir.exit')}
          </button>
        </div>
      ) : (
        <>
          {timeLeft > 0 && (
            <header className="header">
              <h1>{t('tir.title')}</h1>
              <div className="info">
                <p>{t('tir.score')}: {score}</p>
                <p>{t('tir.time')}: {timeLeft}s</p>
              </div>
            </header>
          )}

          <main>
            {timeLeft === 0 ? (
              <div className="game-over">
                <h2>{t('tir.game_over')}</h2>
                <p>{t('tir.score')}: {score}</p>
                <button
                  className="over-btn"
                  onClick={() => setIsMenuOpen(true)}
                >
                  {t('tir.back')}
                </button>
              </div>
            ) : (
              <div className="game-area">
                {targets.map((target) => (
                  <div
                    key={target.id}
                    className="target"
                    style={{
                      left: target.x,
                      top: target.y,
                      position: 'absolute',
                      backgroundImage: target.image,
                      backgroundSize: 'cover',
                      width: '99px',
                      height: '92px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleTargetClick(target.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default Tir;
