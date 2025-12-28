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
    { id: 'MineSweeper', title: 'mineswepeer', route: '/games/minesweeper' },
    { id: 'ArenaShooter', title: 'arena', route: '/games/arenashooter' },
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
        <p className={styles.greeting}>Hello</p>

        <div className={styles.progressWrapper}>
          <div className={styles.progressText}>
            Прогресс: 39010 / 100000
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: "39%" }}
            />
          </div>

          <div className={styles.progressPercent}>39.0%</div>
        </div>
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
    </div>
  );
};

export default Games;