import { useEffect, useState } from "react";
import { getPoints } from "../../utils/points";
import styles from "./PointsNotification.module.css";

const PointsNotification: React.FC = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [pointsChange, setPointsChange] = useState(0);
  const [prevPoints, setPrevPoints] = useState(getPoints());

  useEffect(() => {
    const checkPoints = () => {
      const currentPoints = getPoints();
      const change = currentPoints - prevPoints;

      if (change > 0) {
        setPointsChange(change);
        setShowNotification(true);
        setPrevPoints(currentPoints);

        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      } else {
        setPrevPoints(currentPoints);
      }
    };

    // Check for points changes
    const interval = setInterval(checkPoints, 500);

    // Listen for storage events
    const handleStorageChange = () => {
      checkPoints();
    };

    window.addEventListener("storage", handleStorageChange);

    // Listen for custom events
    const handleGameWin = () => {
      checkPoints();
    };

    window.addEventListener("game-win" as any, handleGameWin);
    window.addEventListener("achievement-unlocked" as any, handleGameWin);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("game-win" as any, handleGameWin);
      window.removeEventListener("achievement-unlocked" as any, handleGameWin);
    };
  }, [prevPoints]);

  if (!showNotification || pointsChange <= 0) {
    return null;
  }

  return (
    <div className={styles.notification}>
      <div className={styles.content}>
        <span className={styles.icon}>⭐</span>
        <span className={styles.text}>
          +{pointsChange} очков!
        </span>
      </div>
    </div>
  );
};

export default PointsNotification;



