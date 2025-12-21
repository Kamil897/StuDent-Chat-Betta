import { useEffect, useState } from "react";
import styles from "./Wallet.module.css";
import {
  getPoints,
  getTransactions,
  getPointsStats,
  type PointsTransaction,
} from "../../utils/points";

/* ================= COMPONENT ================= */

const Wallet: React.FC = () => {
  const [points, setPoints] = useState<number>(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getPointsStats> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"balance" | "transactions" | "stats">("balance");

  useEffect(() => {
    // Load data from localStorage
    setPoints(getPoints());
    setTransactions(getTransactions());
    setStats(getPointsStats());
    setLoading(false);

    // Listen for storage changes (when points are updated from other components)
    const handleStorageChange = () => {
      setPoints(getPoints());
      setTransactions(getTransactions());
      setStats(getPointsStats());
    };

    window.addEventListener("storage", handleStorageChange);
    // Also check periodically for changes (for same-tab updates)
    const interval = setInterval(() => {
      setPoints(getPoints());
      setTransactions(getTransactions());
      setStats(getPointsStats());
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  /* ================= HELPERS ================= */

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getTransactionIcon = (type: PointsTransaction["type"]) => {
    const icons: Record<PointsTransaction["type"], string> = {
      game_win: "🎮",
      achievement: "🏆",
      shop_purchase: "🛒",
      reward: "🎁",
    };
    return icons[type] || "💰";
  };

  const getTransactionLabel = (type: PointsTransaction["type"]) => {
    const labels: Record<PointsTransaction["type"], string> = {
      game_win: "Победа в игре",
      achievement: "Достижение",
      shop_purchase: "Покупка в магазине",
      reward: "Награда",
    };
    return labels[type] || type;
  };

  const getTransactionColor = (_type: PointsTransaction["type"], amount: number) => {
    if (amount > 0) {
      return "#4CAF50"; // Green for earning
    }
    return "#f44336"; // Red for spending
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className={styles["wallet-container"]}>
        <div className={styles.loading}>Загрузка кошелька...</div>
      </div>
    );
  }

  return (
    <div className={styles["wallet-container"]}>
      <div className={styles["wallet-header"]}>
        <h2>💰 Кошелек</h2>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "balance" ? styles.active : ""}`}
          onClick={() => setActiveTab("balance")}
        >
          Баланс
        </button>
        <button
          className={`${styles.tab} ${activeTab === "transactions" ? styles.active : ""}`}
          onClick={() => setActiveTab("transactions")}
        >
          История
        </button>
        <button
          className={`${styles.tab} ${activeTab === "stats" ? styles.active : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          Статистика
        </button>
      </div>

      {/* ===== BALANCE ===== */}
      {activeTab === "balance" && (
        <div className={styles["balance-section"]}>
          <div className={styles["balance-cards"]}>
            <div className={`${styles["balance-card"]} ${styles.points}`}>
              <div className={styles["balance-icon"]}>⭐️</div>
              <h3>Баллы</h3>
              <p className={styles["balance-amount"]}>{points.toLocaleString()}</p>
              <div className={styles["balance-info"]}>
                <p>Баллы можно получить за:</p>
                <ul>
                  <li>🎮 Победы в играх (+15 баллов)</li>
                  <li>🏆 Достижения (+5 баллов)</li>
                </ul>
                <p className={styles["balance-note"]}>
                  Баллы можно тратить в магазине (скоро)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TRANSACTIONS ===== */}
      {activeTab === "transactions" && (
        <div className={styles["transactions-section"]}>
          {transactions.length === 0 ? (
            <div className={styles["empty-state"]}>
              <p>Нет транзакций</p>
              <p className={styles["empty-hint"]}>
                Играйте в игры или получайте достижения, чтобы заработать баллы!
              </p>
            </div>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className={styles["transaction-item"]}>
                <span
                  style={{ color: getTransactionColor(t.type, t.amount) }}
                  className={styles["transaction-icon"]}
                >
                  {getTransactionIcon(t.type)}
                </span>

                <div className={styles["transaction-info"]}>
                  <div className={styles["transaction-title"]}>
                    {getTransactionLabel(t.type)}
                  </div>
                  <div className={styles["transaction-source"]}>{t.source}</div>
                  <small className={styles["transaction-date"]}>{formatDate(t.createdAt)}</small>
                </div>

                <strong
                  className={styles["transaction-amount"]}
                  style={{ color: getTransactionColor(t.type, t.amount) }}
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount.toLocaleString()} ⭐️
                </strong>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== STATS ===== */}
      {activeTab === "stats" && stats && (
        <div className={styles["stats-section"]}>
          <div className={styles["stat-card"]}>
            <h4>Всего заработано</h4>
            <p className={styles["stat-value"]}>+{stats.totalEarned.toLocaleString()} ⭐️</p>
          </div>

          <div className={styles["stat-card"]}>
            <h4>Всего потрачено</h4>
            <p className={styles["stat-value"]}>-{stats.totalSpent.toLocaleString()} ⭐️</p>
          </div>

          <div className={styles["stat-card"]}>
            <h4>Побед в играх</h4>
            <p className={styles["stat-value"]}>{stats.gameWins}</p>
            <p className={styles["stat-subtext"]}>
              Заработано: {stats.gameWins * 15} ⭐️
            </p>
          </div>

          <div className={styles["stat-card"]}>
            <h4>Достижений</h4>
            <p className={styles["stat-value"]}>{stats.achievements}</p>
            <p className={styles["stat-subtext"]}>
              Заработано: {stats.achievements * 5} ⭐️
            </p>
          </div>

          <div className={styles["stat-card"]}>
            <h4>Всего транзакций</h4>
            <p className={styles["stat-value"]}>{transactions.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
