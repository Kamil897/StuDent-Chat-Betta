import React, { useEffect, useRef, useState } from "react";
import styles from "./TeleportingCube.module.css";
import { handleGameWin } from '../../utils/gameRewards';

type GameMode = "single" | "multiplayer";

export default function TeleportingCubeGameApp() {
  const [gameMode, setGameMode] = useState<GameMode>("single");
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [speedText, setSpeedText] = useState("1x");
  const [cubeSkin] = useState("default");
  const [bombSkin] = useState("default");
  const [isGameActive, setIsGameActive] = useState(true);
  const [achievementsUnlocked, setAchievementsUnlocked] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("achievementsUnlocked") || "[]");
    } catch {
      return [];
    }
  });

  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const cubeRef = useRef<HTMLDivElement | null>(null);

  // ✅ браузерный таймер
  const teleportTimerRef = useRef<number | null>(null);

  const cubeClickedRef = useRef(false);
  const isBombRef = useRef(false);

  const baseSpeedRef = useRef(2000);
  const currentSpeedRef = useRef(2000);

  const maxScoreRef = useRef<number>(
    parseInt(localStorage.getItem("maxScore") || "0", 10)
  );
  const player1MaxScoreRef = useRef<number>(
    parseInt(localStorage.getItem("player1MaxScore") || "0", 10)
  );
  const player2MaxScoreRef = useRef<number>(
    parseInt(localStorage.getItem("player2MaxScore") || "0", 10)
  );
  const gameTimeRef = useRef<number>(60); // 60 секунд на раунд
  const [timeLeft, setTimeLeft] = useState(gameTimeRef.current);

  /* =========================
     ACHIEVEMENTS (FRONT ONLY)
  ========================= */
  const achievementsDef = useRef([
    { id: "firstClick", text: "First Click!", check: () => score >= 1 },
    { id: "score10", text: "Score 10 Points!", check: () => score >= 10 },
    { id: "score50", text: "Score 50 Points!", check: () => score >= 50 },
    { id: "level5", text: "Reach Level 5!", check: () => level >= 5 },
    { id: "speed3x", text: "Speed 3x!", check: () => parseFloat(speedText) >= 3 },
  ]);

  const saveMaxScore = (v: number) =>
    localStorage.setItem("maxScore", String(v));

  const saveAchievements = (arr: string[]) =>
    localStorage.setItem("achievementsUnlocked", JSON.stringify(arr));

  /* =========================
     GAME LOGIC
  ========================= */
  const positionCube = () => {
    if (!gameAreaRef.current || !cubeRef.current) return;

    const size = isBombRef.current ? 40 : 50;
    const padding = 20;

    const maxX = gameAreaRef.current.clientWidth - size - padding;
    const maxY = gameAreaRef.current.clientHeight - size - padding;

    cubeRef.current.style.left = Math.random() * maxX + padding + "px";
    cubeRef.current.style.top = Math.random() * maxY + padding + "px";
  };

  const applyCurrentSkin = () => {
    if (!cubeRef.current) return;

    cubeRef.current.className = "cube";

    if (isBombRef.current) {
      cubeRef.current.classList.add("bomb");
      if (bombSkin !== "default") cubeRef.current.classList.add(bombSkin);
    } else {
      if (cubeSkin !== "default") cubeRef.current.classList.add(cubeSkin);
    }
  };

  const setMode = () => {
    isBombRef.current = Math.random() < 0.25;
    applyCurrentSkin();
  };

  const checkAchievements = () => {
    let updated = false;
    const unlocked = [...achievementsUnlocked];

    achievementsDef.current.forEach(a => {
      if (!unlocked.includes(a.id) && a.check()) {
        unlocked.push(a.id);
        updated = true;
      }
    });

    if (updated) {
      setAchievementsUnlocked(unlocked);
      saveAchievements(unlocked);
    }
  };

  useEffect(() => {
    if (gameMode === "single") {
      if (score > maxScoreRef.current) {
        maxScoreRef.current = score;
        saveMaxScore(score);
      }
      // Award points for milestones
      if (score === 10 || score === 25 || score === 50) {
        handleGameWin("Teleporting Cube");
      }
    } else {
      if (currentPlayer === 1 && score > player1MaxScoreRef.current) {
        player1MaxScoreRef.current = score;
        localStorage.setItem("player1MaxScore", String(score));
      }
      if (currentPlayer === 2 && score > player2MaxScoreRef.current) {
        player2MaxScoreRef.current = score;
        localStorage.setItem("player2MaxScore", String(score));
      }
    }
    checkAchievements();
  }, [score, level, speedText, gameMode, currentPlayer]);

  const endPlayerRoundRef = useRef<(() => void) | null>(null);

  const endPlayerRound = () => {
    setIsGameActive(false);
    if (currentPlayer === 1) {
      setPlayer1Score(score);
      // Переключаем на игрока 2
      setTimeout(() => {
        setCurrentPlayer(2);
        setScore(0);
        setLevel(1);
        setSpeedText("1x");
        currentSpeedRef.current = baseSpeedRef.current;
        setTimeLeft(gameTimeRef.current);
        setIsGameActive(true);
        setMode();
        positionCube();
        startTeleportTimer();
      }, 2000);
    } else {
      setPlayer2Score(score);
      // Игра окончена, показываем результаты
    }
  };

  endPlayerRoundRef.current = endPlayerRound;

  // Таймер для мультиплеера
  useEffect(() => {
    if (gameMode === "multiplayer" && isGameActive) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (endPlayerRoundRef.current) {
              endPlayerRoundRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameMode, isGameActive]);

  const resetMultiplayerGame = () => {
    setCurrentPlayer(1);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setScore(0);
    setLevel(1);
    setSpeedText("1x");
    currentSpeedRef.current = baseSpeedRef.current;
    setTimeLeft(gameTimeRef.current);
    setIsGameActive(true);
    setMode();
    positionCube();
    startTeleportTimer();
  };

  const updateProgress = (newScore: number) => {
    setLevel(Math.floor(newScore / 10) + 1);

    const reduction = Math.floor(newScore / 5) * 0.05;
    const speed = Math.max(400, baseSpeedRef.current * (1 - reduction));

    currentSpeedRef.current = speed;
    setSpeedText((baseSpeedRef.current / speed).toFixed(1) + "x");
  };

  const clearTimer = () => {
    if (teleportTimerRef.current) {
      clearTimeout(teleportTimerRef.current);
      teleportTimerRef.current = null;
    }
  };

  const startTeleportTimer = () => {
    clearTimer();

    teleportTimerRef.current = window.setTimeout(() => {
      if (!cubeClickedRef.current && !isBombRef.current) {
        setScore(prev => Math.max(0, prev - 1));
      }

      cubeClickedRef.current = false;
      setMode();
      positionCube();
      startTeleportTimer();
    }, currentSpeedRef.current);
  };

  const createClickEffect = (x: number, y: number, type = "") => {
    if (!gameAreaRef.current) return;

    const rect = gameAreaRef.current.getBoundingClientRect();
    const el = document.createElement("div");

    el.className = `click-effect ${type}`;
    el.style.left = x - rect.left - 15 + "px";
    el.style.top = y - rect.top - 15 + "px";

    gameAreaRef.current.appendChild(el);
    setTimeout(() => el.remove(), 600);
  };

  const onCubeClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!cubeRef.current) return;

    cubeRef.current.classList.add("clicked");
    setTimeout(() => cubeRef.current?.classList.remove("clicked"), 400);

    if (isBombRef.current) {
      createClickEffect(e.clientX, e.clientY, "error");
      if (gameMode === "multiplayer" && isGameActive) {
        endPlayerRound();
      } else {
        setScore(0);
        setLevel(1);
        currentSpeedRef.current = baseSpeedRef.current;
        setSpeedText("1x");
      }
    } else {
      createClickEffect(e.clientX, e.clientY, "success");
      cubeClickedRef.current = true;

      setScore(prev => {
        const next = prev + 1;
        updateProgress(next);
        return next;
      });
    }

    clearTimer();
    setTimeout(() => {
      setMode();
      positionCube();
      startTeleportTimer();
    }, 100);
  };


  useEffect(() => {
    if (gameMode === "single" || (gameMode === "multiplayer" && isGameActive)) {
      setMode();
      positionCube();
      startTeleportTimer();
      return clearTimer;
    }
  }, [gameMode, isGameActive]);

  useEffect(() => {
    applyCurrentSkin();
  }, [cubeSkin, bombSkin]);

  /* =========================
     UI
  ========================= */
  const achievementsList = achievementsDef.current.map(a => ({
    ...a,
    unlocked: achievementsUnlocked.includes(a.id),
  }));

  return (
    <div className={styles.appWrap}>
      <div className={styles.modeSelector}>
        <button 
          className={`${styles.modeButton} ${gameMode === "single" ? styles.active : ""}`}
          onClick={() => {
            setGameMode("single");
            resetMultiplayerGame();
          }}
        >
          Single Player
        </button>
        <button 
          className={`${styles.modeButton} ${gameMode === "multiplayer" ? styles.active : ""}`}
          onClick={() => {
            setGameMode("multiplayer");
            resetMultiplayerGame();
          }}
        >
          Multiplayer
        </button>
      </div>

      {gameMode === "multiplayer" && (
        <div className={styles.multiplayerInfo}>
          <div className={styles.playerIndicator}>
            <div className={`${styles.playerCard} ${currentPlayer === 1 ? styles.active : ""}`}>
              <h3>Player 1</h3>
              <div className={styles.playerScore}>Score: {player1Score}</div>
              <div className={styles.playerBest}>Best: {player1MaxScoreRef.current}</div>
            </div>
            <div className={styles.vs}>VS</div>
            <div className={`${styles.playerCard} ${currentPlayer === 2 ? styles.active : ""}`}>
              <h3>Player 2</h3>
              <div className={styles.playerScore}>Score: {player2Score}</div>
              <div className={styles.playerBest}>Best: {player2MaxScoreRef.current}</div>
            </div>
          </div>
          {isGameActive && (
            <div className={styles.timer}>
              <div className={styles.timerLabel}>Time Left</div>
              <div className={styles.timerValue}>{timeLeft}s</div>
            </div>
          )}
          {!isGameActive && currentPlayer === 2 && player2Score > 0 && (
            <div className={styles.gameResult}>
              <h2>
                {player1Score > player2Score ? "Player 1 Wins!" :
                 player2Score > player1Score ? "Player 2 Wins!" : "It's a Tie!"}
              </h2>
              <button className={styles.playAgainButton} onClick={resetMultiplayerGame}>
                Play Again
              </button>
            </div>
          )}
        </div>
      )}

      <div ref={gameAreaRef} className={styles.gameArea} style={{ opacity: isGameActive ? 1 : 0.5 }}>
        <div 
          ref={cubeRef} 
          className={styles.cube}
          onClick={isGameActive ? onCubeClick : undefined}
          style={{ cursor: isGameActive ? 'pointer' : 'not-allowed' }}
        />
      </div>
      <div className={styles.gameInfo}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Score</div>
            <div className={styles.statValue}>{score}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Level</div>
            <div className={styles.statValue}>{level}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Speed</div>
            <div className={styles.statValue}>{speedText}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Best Score</div>
            <div className={styles.statValue}>
              {gameMode === "single" ? maxScoreRef.current : 
               currentPlayer === 1 ? player1MaxScoreRef.current : player2MaxScoreRef.current}
            </div>
          </div>
        </div>
        {gameMode === "single" && (
          <div className={styles.achievementsSection}>
            <h3 className={styles.achievementsTitle}>Achievements</h3>
            <div className={styles.achievementsList}>
              {achievementsList.map(a => (
                <div 
                  key={a.id} 
                  className={`${styles.achievementItem} ${a.unlocked ? styles.unlocked : ''}`}
                >
                  <span className={styles.achievementText}>{a.text}</span>
                  {a.unlocked && <span className={styles.achievementCheck}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
