import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Achievements.module.css";
import { getAllAchievements, type Achievement } from "../../utils/achievements";

type FilterType = "all" | "earned" | "points";

const Achievements = () => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const loadAchievements = () => {
      const allAchievements = getAllAchievements();
      setAchievements(allAchievements);
    };

    loadAchievements();
    
    // Listen for achievement unlocks
    const handleAchievementUnlock = () => {
      loadAchievements();
    };
    
    window.addEventListener("achievement-unlocked", handleAchievementUnlock);
    window.addEventListener("game-win", handleAchievementUnlock);
    
    return () => {
      window.removeEventListener("achievement-unlocked", handleAchievementUnlock);
      window.removeEventListener("game-win", handleAchievementUnlock);
    };
  }, []);

  const filteredAchievements = achievements.filter((a) => {
    if (activeFilter === "earned") return a.unlockedAt !== undefined;
    if (activeFilter === "points") {
      // Filter by high-value achievements (50+ points equivalent)
      const highValueIds = ["50_games_won", "100_games_won", "250_games_won", "500_games_won"];
      return highValueIds.includes(a.id);
    }
    return true;
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          {t("achievements.title")} <span>🏆</span>
        </h1>

        <div className={styles.filters}>
          <button
            className={`${styles.filter} ${activeFilter === "all" ? styles.active : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            ☰ {t("achievements.filters.all")}
          </button>
          <button
            className={`${styles.filter} ${activeFilter === "earned" ? styles.active : ""}`}
            onClick={() => setActiveFilter("earned")}
          >
            ⬤ {t("achievements.filters.earned")}
          </button>
          <button
            className={`${styles.filter} ${activeFilter === "points" ? styles.active : ""}`}
            onClick={() => setActiveFilter("points")}
          >
            ★ {t("achievements.filters.points")}
          </button>
        </div>
      </div>

      {/* Achievements */}
      <div className={styles.grid}>
        {filteredAchievements.length === 0 ? (
          <div className={styles.empty}>
            <p>Нет достижений для отображения</p>
          </div>
        ) : (
          filteredAchievements.map((a) => (
            <div
              key={a.id}
              className={`${styles.card} ${!a.unlockedAt ? styles.locked : ""}`}
            >
              <div className={styles.icon}>{a.icon}</div>

              <div className={styles.info}>
                <h3>{a.name}</h3>
                <p>{a.description}</p>
                {a.unlockedAt && (
                  <p className={styles.unlockedDate}>
                    Получено: {new Date(a.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className={styles.points}>+5</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Achievements;
