import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Achievements.module.css";

type FilterType = "all" | "earned" | "points";

const achievementsData = [
  {
    id: 1,
    titleKey: "achievements.items.firstStep.title",
    descriptionKey: "achievements.items.firstStep.description",
    points: 10,
    earned: true,
    icon: "🚀",
  },
  {
    id: 2,
    titleKey: "achievements.items.persistence.title",
    descriptionKey: "achievements.items.persistence.description",
    points: 25,
    earned: true,
    icon: "🔥",
  },
  {
    id: 3,
    titleKey: "achievements.items.pro.title",
    descriptionKey: "achievements.items.pro.description",
    points: 50,
    earned: false,
    icon: "🏆",
  },
];

const Achievements = () => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredAchievements = achievementsData.filter((a) => {
    if (activeFilter === "earned") return a.earned;
    if (activeFilter === "points") return a.points >= 25;
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
        {filteredAchievements.map((a) => (
          <div
            key={a.id}
            className={`${styles.card} ${!a.earned ? styles.locked : ""}`}
          >
            <div className={styles.icon}>{a.icon}</div>

            <div className={styles.info}>
              <h3>{t(a.titleKey)}</h3>
              <p>{t(a.descriptionKey)}</p>
            </div>

            <div className={styles.points}>+{a.points}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
