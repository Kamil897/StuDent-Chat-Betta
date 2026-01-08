import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./LeaderBoard.module.css";
import { getLeaderboard, syncCurrentUserPoints, removeDuplicates, type LeaderboardUser } from "../../utils/leaderboard";
import { connectLeaderboardSocket, onLeaderboardUpdate, offLeaderboardUpdate, disconnectLeaderboardSocket } from "../../utils/leaderboardSocket";
import { getGameLeaderboard, getGamesWithRecords, getGameName, type GameRecord } from "../../utils/gameRecords";

export default function Leaderboard() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"points" | "games">("points");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("all");

  const itemsPerPage = 10;

  useEffect(() => {
    syncCurrentUserPoints();
    removeDuplicates();
    const data = getLeaderboard();
    setLeaderboardData(data);

    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUserId(user.id || user.username || null);
      }
    } catch (e) {
      console.error("Error loading current user:", e);
    }

    // Load game records
    const updateGameRecords = () => {
      const records = selectedGame === "all" 
        ? getGameLeaderboard() 
        : getGameLeaderboard(selectedGame);
      setGameRecords(records);
    };
    updateGameRecords();

    // Подключаемся к WebSocket для real-time обновлений
    connectLeaderboardSocket();

    // Подписываемся на обновления лидерборда
    const handleLeaderboardUpdate = (leaderboard: any[]) => {
      setLeaderboardData(leaderboard);
    };

    onLeaderboardUpdate(handleLeaderboardUpdate);
    
    // Listen for game record updates
    const handleGameRecordUpdate = () => {
      updateGameRecords();
    };
    window.addEventListener("game-record-updated", handleGameRecordUpdate);

    return () => {
      offLeaderboardUpdate(handleLeaderboardUpdate);
      disconnectLeaderboardSocket();
      window.removeEventListener("game-record-updated", handleGameRecordUpdate);
    };
  }, [selectedGame]);

  useEffect(() => {
    const updateLeaderboard = () => {
      syncCurrentUserPoints();
      removeDuplicates();
      const data = getLeaderboard();
      setLeaderboardData(data);
    };

    window.addEventListener("storage", updateLeaderboard);
    window.addEventListener("game-win" as any, updateLeaderboard);

    return () => {
      window.removeEventListener("storage", updateLeaderboard);
      window.removeEventListener("game-win" as any, updateLeaderboard);
    };
  }, []);

  const currentData = activeTab === "points" ? leaderboardData : gameRecords;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPlayers = activeTab === "points" 
    ? leaderboardData.slice(startIndex, startIndex + itemsPerPage)
    : [];

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getAvatarUrl = (user: LeaderboardUser | GameRecord) =>
    user.avatarSeed
      ? `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.avatarSeed}`
      : "/profileimg.png";

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  return (
    <section className={styles.leaderboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("leaderboard.title")}</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "points" ? styles.isActive : ""}`}
            onClick={() => {
              setActiveTab("points");
              setCurrentPage(1);
            }}
          >
            ⭐ {t("leaderboard.tabs.points")}
          </button>

          <button
            className={`${styles.tab} ${activeTab === "games" ? styles.isActive : ""}`}
            onClick={() => {
              setActiveTab("games");
              setCurrentPage(1);
            }}
          >
            🎮 {t("leaderboard.tabs.games")}
          </button>
        </div>
      </header>

      {activeTab === "points" && (
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.head}`}>
            <div className={styles.cell}>{t("leaderboard.table.rank")}</div>
            <div className={styles.cell}>{t("leaderboard.table.player")}</div>
            <div className={styles.cell}>{t("leaderboard.table.points")}</div>
            <div className={styles.cell}>{t("leaderboard.table.top")}</div>
          </div>

          {currentPlayers.length === 0 ? (
            <div className={styles.emptyState}>
              <p>{t("leaderboard.empty.noPlayers")}</p>
              <p className={styles.emptyHint}>{t("leaderboard.empty.hint")}</p>
            </div>
          ) : (
            currentPlayers.map((user, i) => {
              const rank = startIndex + i + 1;
              const isCurrentUser = user.id === currentUserId;

              return (
                <div className={`${styles.row} ${isCurrentUser ? styles.currentUser : ""}`} key={user.id}>
                  <div className={styles.cell}>
                    <span className={styles.rank}>
                      {getRankIcon(rank)} {rank}
                    </span>
                  </div>
                  <div className={styles.cell}>
                    <div className={styles.userInfo}>
                      <img src={getAvatarUrl(user)} alt={user.name} className={styles.avatar} />
                      <div>
                        <div className={styles.userName}>
                          {user.name || user.username}
                          {isCurrentUser && <span className={styles.youBadge}> ({t("leaderboard.you")})</span>}
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
        <div>
          <div className={styles.gameSelector}>
            <select
              className={styles.gameSelect}
              value={selectedGame}
              onChange={(e) => {
                setSelectedGame(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Все игры</option>
              {getGamesWithRecords().map((gameId) => (
                <option key={gameId} value={gameId}>
                  {getGameName(gameId)}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.table}>
            <div className={`${styles.row} ${styles.head}`}>
              <div className={styles.cell}>{t("leaderboard.table.rank")}</div>
              <div className={styles.cell}>{t("leaderboard.table.player")}</div>
              <div className={styles.cell}>Игра</div>
              <div className={styles.cell}>Рекорд</div>
            </div>

            {gameRecords.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Пока нет рекордов</p>
                <p className={styles.emptyHint}>Играйте в игры, чтобы установить рекорды!</p>
              </div>
            ) : (
              gameRecords.slice(startIndex, startIndex + itemsPerPage).map((record, i) => {
                const rank = startIndex + i + 1;
                const isCurrentUser = record.userId === currentUserId;

                return (
                  <div className={`${styles.row} ${isCurrentUser ? styles.currentUser : ""}`} key={`${record.userId}-${record.gameId}-${record.recordType}`}>
                    <div className={styles.cell}>
                      <span className={styles.rank}>
                        {getRankIcon(rank)} {rank}
                      </span>
                    </div>
                    <div className={styles.cell}>
                      <div className={styles.userInfo}>
                        <img src={getAvatarUrl(record)} alt={record.name} className={styles.avatar} />
                        <div>
                          <div className={styles.userName}>
                            {record.name || record.username}
                            {isCurrentUser && <span className={styles.youBadge}> ({t("leaderboard.you")})</span>}
                          </div>
                          <div className={styles.userEmail}>{record.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cell}>
                      <span>{getGameName(record.gameId)}</span>
                    </div>
                    <div className={styles.cell}>
                      <span className={styles.points}>⭐ {record.value.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {((activeTab === "points" && leaderboardData.length > 0) || (activeTab === "games" && gameRecords.length > 0)) && (
        <footer className={styles.footer}>
          <div className={styles.pagination}>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              ‹
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={currentPage === i + 1 ? styles.isActive : ""} onClick={() => handlePageChange(i + 1)}>
                {i + 1}
              </button>
            ))}

            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
              ›
            </button>
          </div>
        </footer>
      )}
    </section>
  );
}
