import { useState } from "react";
import styles from "./LeaderBoard.module.css";

type User = {
  id: number;
  name: string;
  avatar?: string;
};

type LeaderboardItem = {
  id: number;
  score: number;
  rank: number;
  user: User;
};

type GameKey = "snake" | "asteroids" | "pingpong" | "tictactoe";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<"games" | "shop">("games");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedGame, setSelectedGame] = useState<GameKey>("snake");

  const itemsPerPage = 10;

  const games: { name: GameKey; label: string }[] = [
    { name: "snake", label: "Snake" },
    { name: "asteroids", label: "Asteroids" },
    { name: "pingpong", label: "Ping Pong" },
    { name: "tictactoe", label: "Tic Tac Toe" },
  ];

  // 🔹 Статичные данные
  const leaderboardData: Record<GameKey, LeaderboardItem[]> = {
    snake: [
      {
        id: 1,
        score: 1200,
        rank: 1,
        user: { id: 101, name: "Alex" },
      },
      {
        id: 2,
        score: 950,
        rank: 2,
        user: { id: 102, name: "Maria" },
      },
      {
        id: 3,
        score: 800,
        rank: 3,
        user: { id: 103, name: "John" },
      },
    ],
    asteroids: [
      {
        id: 4,
        score: 3000,
        rank: 1,
        user: { id: 104, name: "Leo" },
      },
    ],
    pingpong: [],
    tictactoe: [],
  };

  const data = leaderboardData[selectedGame];

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPlayers = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <section className={styles.leaderboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Лидерборд</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "games" ? styles.isActive : ""
            }`}
            onClick={() => setActiveTab("games")}
          >
            Очки по играм
          </button>

          <button
            className={`${styles.tab} ${
              activeTab === "shop" ? styles.isActive : ""
            }`}
            onClick={() => setActiveTab("shop")}
          >
            Баллы в магазине
          </button>
        </div>

        {activeTab === "games" && (
          <select
            className={styles.gameSelect}
            value={selectedGame}
            onChange={(e) => {
              setSelectedGame(e.target.value as GameKey);
              setCurrentPage(1);
            }}
          >
            {games.map((game) => (
              <option key={game.name} value={game.name}>
                {game.label}
              </option>
            ))}
          </select>
        )}
      </header>

      {activeTab === "games" && (
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.head}`}>
            <div className={styles.cell}>#</div>
            <div className={styles.cell}>Игрок</div>
            <div className={styles.cell}>Очки</div>
            <div className={styles.cell}>Место</div>
          </div>

          {currentPlayers.length === 0 ? (
            <div className={styles.emptyState}>Нет данных</div>
          ) : (
            currentPlayers.map((p, i) => (
              <div className={styles.row} key={p.id}>
                <div className={styles.cell}>{startIndex + i + 1}</div>
                <div className={styles.cell}>{p.user.name}</div>
                <div className={styles.cell}>{p.score}</div>
                <div className={styles.cell}>{p.rank}</div>
              </div>
            ))
          )}
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={currentPage === i + 1 ? styles.isActive : ""}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      </footer>
    </section>
  );
}
