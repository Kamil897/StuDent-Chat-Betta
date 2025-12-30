import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Games.module.scss';
import { getPointsStats } from '../../utils/points';
import { isGameUnlocked, getGameUnlockPrice, setLockedGames } from '../../utils/gameUnlock';

interface GameCard {
  id: string;
  title: string;
  route: string;
  image?: string;
  locked?: boolean;
}

const Games: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(getPointsStats());

  // Update stats when storage changes
  useEffect(() => {
    const updateStats = () => {
      setStats(getPointsStats());
    };

    window.addEventListener('storage', updateStats);
    window.addEventListener('game-win', updateStats);
    
    // Initial load
    updateStats();

    return () => {
      window.removeEventListener('storage', updateStats);
      window.removeEventListener('game-win', updateStats);
    };
  }, []);

  // Initialize locked games on first load
  useEffect(() => {
    const lockedGames = localStorage.getItem("locked_games");
    if (!lockedGames) {
      // Set some games as locked by default
      setLockedGames(['ArenaShooter', 'MineSweeper', 'TeleportingCubeGame']);
    }
  }, []);

  const gameCards: GameCard[] = [
    { id: 'Asteroid', title: 'asteroid', route: '/games/meteors', locked: !isGameUnlocked('Asteroid') },
    { id: 'Pingpong', title: 'ping-pong', route: '/games/pingpong', locked: !isGameUnlocked('Pingpong') },
    { id: 'TicTacToe', title: 'TicTacToe', route: '/games/don', locked: !isGameUnlocked('TicTacToe') },
    { id: 'MineSweeper', title: 'mineswepeer', route: '/games/minesweeper', locked: !isGameUnlocked('MineSweeper') },
    { id: 'ArenaShooter', title: 'arena', route: '/games/arenashooter', locked: !isGameUnlocked('ArenaShooter') },
    { id: 'TeleportingCubeGame', title: 'Cube', route: '/games/TeleportingCubeGame', locked: !isGameUnlocked('TeleportingCubeGame') },
    { id: 'Tir', title: 'Tir', route: '/games/Tir', locked: !isGameUnlocked('Tir') },
    { id: 'Snake', title: 'Snake', route: '/games/Snake', locked: !isGameUnlocked('Snake') },
  ];

  // Calculate progress based on games played (game wins)
  const totalGamesPlayed = stats.gameWins;
  const progressGoal = 100; // Goal: 100 games played
  const progressPercent = Math.min((totalGamesPlayed / progressGoal) * 100, 100);

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
        <Link to="/Leaderboard" className={styles.user}>
          Leaderboard 🏆
        </Link>
      </header>


      <div className={styles.dateSection}>
        <p className={styles.greeting}>Hello</p>

        <div className={styles.progressWrapper}>
          <div className={styles.progressText}>
            Игр сыграно: {totalGamesPlayed} / {progressGoal}
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className={styles.progressPercent}>{progressPercent.toFixed(1)}%</div>
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
            className={`${styles.gameCard} ${game.locked ? styles.locked : ''}`}
            onClick={() => {
              if (!game.locked) {
                navigate(game.route);
              } else {
                navigate('/Magaz');
              }
            }}
          >
            {game.locked && (
              <div className={styles.lockOverlay}>
                <div className={styles.lockIcon}>🔒</div>
                <div className={styles.unlockPrice}>{getGameUnlockPrice(game.id)} баллов</div>
              </div>
            )}
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