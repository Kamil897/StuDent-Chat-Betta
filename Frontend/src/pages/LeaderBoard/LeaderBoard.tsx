import { useState, useEffect } from "react";
import styles from "./LeaderBoard.module.css";
import { getLeaderboard, syncCurrentUserPoints, removeDuplicates, type LeaderboardUser } from "../../utils/leaderboard";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<"points" | "games">("points");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    // Sync current user's points
    syncCurrentUserPoints();
    
    // Remove duplicates before loading
    removeDuplicates();
    
    // Load leaderboard data
    const data = getLeaderboard();
    setLeaderboardData(data);
    
    // Get current user ID
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUserId(user.id || null);
      }
    } catch (e) {
      console.error("Error loading current user:", e);
    }
  }, []);

  // Listen for points updates
  useEffect(() => {
    const handleStorageChange = () => {
      syncCurrentUserPoints();
      removeDuplicates();
      const data = getLeaderboard();
      setLeaderboardData(data);
    };

    const handleGameWin = () => {
      syncCurrentUserPoints();
      removeDuplicates();
      const data = getLeaderboard();
      setLeaderboardData(data);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("game-win" as any, handleGameWin);
    
    // Also check periodically
    const interval = setInterval(() => {
      syncCurrentUserPoints();
      removeDuplicates();
      const data = getLeaderboard();
      setLeaderboardData(data);
    }, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("game-win" as any, handleGameWin);
      clearInterval(interval);
    };
  }, []);

  const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPlayers = leaderboardData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getAvatarUrl = (user: LeaderboardUser) => {
    if (user.avatarSeed) {
      return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.avatarSeed}`;
    }
    return '/profileimg.png';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  return (
    <section className={styles.leaderboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Лидерборд</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "points" ? styles.isActive : ""
            }`}
            onClick={() => {
              setActiveTab("points");
              setCurrentPage(1);
            }}
          >
            ⭐ Баллы
          </button>

          <button
            className={`${styles.tab} ${
              activeTab === "games" ? styles.isActive : ""
            }`}
            onClick={() => {
              setActiveTab("games");
              setCurrentPage(1);
            }}
          >
            🎮 Игры
          </button>
        </div>
      </header>

      {activeTab === "points" && (
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.head}`}>
            <div className={styles.cell}>Место</div>
            <div className={styles.cell}>Игрок</div>
            <div className={styles.cell}>Баллы</div>
            <div className={styles.cell}>Ранг</div>
          </div>

          {currentPlayers.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Пока нет игроков в лидерборде</p>
              <p className={styles.emptyHint}>
                Играйте в игры и зарабатывайте баллы, чтобы попасть в топ!
              </p>
            </div>
          ) : (
            currentPlayers.map((user, i) => {
              const rank = startIndex + i + 1;
              const isCurrentUser = user.id === currentUserId;
              
              return (
                <div 
                  className={`${styles.row} ${isCurrentUser ? styles.currentUser : ""}`} 
                  key={user.id}
                >
                  <div className={styles.cell}>
                    <span className={styles.rank}>
                      {getRankIcon(rank)} {rank}
                    </span>
                  </div>
                  <div className={styles.cell}>
                    <div className={styles.userInfo}>
                      <img 
                        src={getAvatarUrl(user)} 
                        alt={user.name}
                        className={styles.avatar}
                      />
                      <div>
                        <div className={styles.userName}>
                          {user.name || user.username}
                          {isCurrentUser && <span className={styles.youBadge}> (Вы)</span>}
                        </div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.cell}>
                    <span className={styles.points}>⭐ {user.points.toLocaleString()}</span>
                  </div>
                  <div className={styles.cell}>
                    {rank <= 3 ? (
                      <span className={styles.topRank}>{getRankIcon(rank)}</span>
                    ) : (
                      <span className={styles.rankNumber}>#{rank}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "games" && (
        <div className={styles.table}>
          <div className={styles.emptyState}>
            <p>Раздел "Игры" скоро будет доступен</p>
            <p className={styles.emptyHint}>
              Здесь будут отображаться рекорды по отдельным играм
            </p>
          </div>
        </div>
      )}

      {leaderboardData.length > 0 && (
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
              disabled={currentPage === totalPages || totalPages === 0}
            >
              ›
            </button>
          </div>
        </footer>
      )}
    </section>
  );
}

