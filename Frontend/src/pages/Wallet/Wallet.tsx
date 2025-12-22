import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Wallet.module.css";
import {
  getPoints,
  getTransactions,
  getPointsStats,
  type PointsTransaction,
} from "../../utils/points";

const Wallet: React.FC = () => {
  const { t } = useTranslation();

  const [points, setPoints] = useState<number>(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getPointsStats> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"balance" | "transactions" | "stats">("balance");

  useEffect(() => {
    setPoints(getPoints());
    setTransactions(getTransactions());
    setStats(getPointsStats());
    setLoading(false);

    const handleStorageChange = () => {
      setPoints(getPoints());
      setTransactions(getTransactions());
      setStats(getPointsStats());
    };

    const handleGameWin = () => {
      setPoints(getPoints());
      setTransactions(getTransactions());
      setStats(getPointsStats());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("game-win" as any, handleGameWin);
    window.addEventListener("achievement-unlocked" as any, handleGameWin);

    const interval = setInterval(() => {
      setPoints(getPoints());
      setTransactions(getTransactions());
      setStats(getPointsStats());
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("game-win" as any, handleGameWin);
      window.removeEventListener("achievement-unlocked" as any, handleGameWin);
      clearInterval(interval);
    };
  }, []);

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
      game_win: t("wallet.transactionLabels.gameWin"),
      achievement: t("wallet.transactionLabels.achievement"),
      shop_purchase: t("wallet.transactionLabels.shopPurchase"),
      reward: t("wallet.transactionLabels.reward"),
    };
    return labels[type] || type;
  };

  const getTransactionColor = (_type: PointsTransaction["type"], amount: number) =>
    amount > 0 ? "#4CAF50" : "#f44336";

  if (loading) {
    return (
      <div className={styles["wallet-container"]}>
        <div className={styles.loading}>{t("wallet.loading")}</div>
      </div>
    );
  }

  return (
    <div className={styles["wallet-container"]}>
      <div className={styles["wallet-header"]}>
        <h2>💰 {t("wallet.title")}</h2>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "balance" ? styles.active : ""}`}
          onClick={() => setActiveTab("balance")}
        >
          {t("wallet.tabs.balance")}
        </button>
        <button
          className={`${styles.tab} ${activeTab === "transactions" ? styles.active : ""}`}
          onClick={() => setActiveTab("transactions")}
        >
          {t("wallet.tabs.transactions")}
        </button>
        <button
          className={`${styles.tab} ${activeTab === "stats" ? styles.active : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          {t("wallet.tabs.stats")}
        </button>
      </div>

      {/* ===== BALANCE ===== */}
      {activeTab === "balance" && (
        <div className={styles["balance-section"]}>
          <div className={styles["balance-cards"]}>
            <div className={`${styles["balance-card"]} ${styles.points}`}>
              <div className={styles["balance-icon"]}>⭐️</div>
              <h3>{t("wallet.balance.points")}</h3>
              <p className={styles["balance-amount"]}>{points.toLocaleString()}</p>
              <div className={styles["balance-info"]}>
                <p>{t("wallet.balance.earnPointsFrom")}</p>
                <ul>
                  <li>🎮 {t("wallet.balance.earnPoints.gameWin", { points: 15 })}</li>
                  <li>🏆 {t("wallet.balance.earnPoints.achievement", { points: 5 })}</li>
                </ul>
                <p className={styles["balance-note"]}>{t("wallet.balance.spendPointsSoon")}</p>
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
              <p>{t("wallet.transactions.noTransactions")}</p>
              <p className={styles["empty-hint"]}>{t("wallet.transactions.emptyHint")}</p>
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
                  <div className={styles["transaction-title"]}>{getTransactionLabel(t.type)}</div>
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
            <h4>{t("wallet.stats.totalEarned")}</h4>
            <p className={styles["stat-value"]}>+{stats.totalEarned.toLocaleString()} ⭐️</p>
          </div>

          <div className={styles["stat-card"]}>
            <h4>{t("wallet.stats.totalSpent")}</h4>
            <p className={styles["stat-value"]}>-{stats.totalSpent.toLocaleString()} ⭐️</p>
          </div>

          <div className={styles["stat-card"]}>
            <h4>{t("wallet.stats.gameWins")}</h4>
            <p className={styles["stat-value"]}>{stats.gameWins}</p>
            <p className={styles["stat-subtext"]}>
              {t("wallet.stats.earnedPoints", { points: stats.gameWins * 15 })}
            </p>
          </div>

          <div className={styles["stat-card"]}>
            <h4>{t("wallet.stats.achievements")}</h4>
            <p className={styles["stat-value"]}>{stats.achievements}</p>
            <p className={styles["stat-subtext"]}>
              {t("wallet.stats.earnedPoints", { points: stats.achievements * 5 })}
            </p>
          </div>

          <div className={styles["stat-card"]}>
            <h4>{t("wallet.stats.totalTransactions")}</h4>
            <p className={styles["stat-value"]}>{transactions.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
