import React from 'react';
import { useNavigate } from 'react-router-dom';

import styles from './Games.module.scss';

interface GameCard {
  id: string;
  title: string;
  route: string;
  image?: string;
}

const Games: React.FC = () => {
  const navigate = useNavigate();


  const gameCards: GameCard[] = [
    { id: 'asteroid', title: 'asteroid', route: '/games/meteors' },
    { id: 'pingpong', title: 'ping-pong', route: '/games/pingpong' },
    { id: 'TicTacToe', title: 'TicTacToe', route: '/games/don' },
    { id: 'MineSweeper', title: 'snake', route: '/games/minesweeper' },
  ];

  const categories = [
    'All',
    'Classic',
    'Settings',
    'Action',
    'Educational',
    'Arcade',
    'Other',
    'My Games',
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Razna</div>
        <div className={styles.user}>
          Leaderboard 🏆
        </div>
      </header>

      <div className={styles.dateSection}>
        <p className={styles.date}>
          {('games.greeting')}: 2025/05/2025
        </p>
        <p className={styles.greeting}>Hello</p>
      </div>

      <nav className={styles.categories}>
        {categories.map((category) => (
          <button
            key={category}
            className={styles.categoryButton}
          >
            {category}
          </button>
        ))}
      </nav>

      <div className={styles.gamesGrid}>
        {gameCards.map((game) => (
          <div
            key={game.id}
            className={styles.gameCard}
            onClick={() => navigate(game.route)}
          >
            <div className={styles.gameImage}>
              {/* Placeholder for game thumbnail */}
            </div>
            <h3 className={styles.gameTitle}>{game.title}</h3>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <h2 className={styles.footerTitle}>
            Learn. Communicate. Develop.
          </h2>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>Group</a>
            <a href="#" className={styles.footerLink}>Code A</a>
            <a href="#" className={styles.footerLink}>My Course</a>
            <a href="#" className={styles.footerLink}>Battle</a>
          </div>
          <p className={styles.copyright}>
            ©️ 2023-2025 RAZNATOV{('games.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Games;