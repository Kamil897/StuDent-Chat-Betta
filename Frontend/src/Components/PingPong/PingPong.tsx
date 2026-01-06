import React, { useRef, useEffect, useState } from "react";
import styles from "./Ping.module.css";
import { useNavigate } from 'react-router-dom';
import { handleGameWin } from '../../utils/gameRewards';
import { findMatch, cancelMatchSearch } from '../../utils/matchmakingSocket';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Получить токен авторизации
function getAuthToken(): string | null {
  try {
    return localStorage.getItem("accessToken") || 
           localStorage.getItem("token") ||
           localStorage.getItem("authToken");
  } catch {
    return null;
  }
}


interface GameState {
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
  paddleY: number;
  aiPaddleY: number;
  playerScore: number;
  aiScore: number;
  upPressed: boolean;
  downPressed: boolean;
}

type Direction = "up" | "down";

const PongNeon: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSearchingMatch, setIsSearchingMatch] = useState<boolean>(false);
  const [matchStatus, setMatchStatus] = useState<string>("");
  const matchStatusIntervalRef = useRef<number | null>(null);
  // const { addPoints } = useUser();
  const navigate = useNavigate();
  // const { t } = useTranslation();

  const gameStateRef = useRef<GameState>({
    ballX: 0,
    ballY: 0,
    ballSpeedX: 4,
    ballSpeedY: 4,
    paddleY: 0,
    aiPaddleY: 0,
    playerScore: 0,
    aiScore: 0,
    upPressed: false,
    downPressed: false
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Очистка интервала поиска матча при размонтировании
  useEffect(() => {
    return () => {
      if (matchStatusIntervalRef.current) {
        clearInterval(matchStatusIntervalRef.current);
        matchStatusIntervalRef.current = null;
      }
    };
  }, []);

  // Поиск матча через WebSocket для real-time подбора
  const findMatchHandler = () => {
    const token = getAuthToken();
    if (!token) {
      alert("Требуется авторизация для мультиплеера");
      return;
    }

    setIsSearchingMatch(true);
    setMatchStatus("Поиск соперника...");

    // Используем WebSocket для real-time matchmaking
    findMatch("PingPong", {
      onSearching: () => {
        setMatchStatus("Поиск соперника...");
      },
      onMatchFound: (data: { matchId: string; opponentId: string; gameId: string }) => {
        setMatchStatus(`Матч найден! ID: ${data.matchId}`);
        setIsSearchingMatch(false);
        setMatchId(data.matchId);
        setOpponentId(data.opponentId);
        if (matchStatusIntervalRef.current) {
          clearInterval(matchStatusIntervalRef.current);
          matchStatusIntervalRef.current = null;
        }
        // TODO: Здесь можно запустить игру с оппонентом
      },
      onError: (error: string) => {
        console.error("Matchmaking error:", error);
        setMatchStatus(`Ошибка: ${error}`);
        setIsSearchingMatch(false);
        if (matchStatusIntervalRef.current) {
          clearInterval(matchStatusIntervalRef.current);
          matchStatusIntervalRef.current = null;
        }
      },
    });
  };

  // Отмена поиска матча через WebSocket
  const cancelMatchSearchHandler = () => {
    const token = getAuthToken();
    if (!token) return;

    cancelMatchSearch(() => {
      setIsSearchingMatch(false);
      setMatchStatus("");
      if (matchStatusIntervalRef.current) {
        clearInterval(matchStatusIntervalRef.current);
        matchStatusIntervalRef.current = null;
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const state = gameStateRef.current;

    const paddleHeight = isMobile ? 70 : 100;
    const paddleWidth = isMobile ? 8 : 10;
    const ballRadius = isMobile ? 8 : 10;
    const paddleSpeed = isMobile ? 5 : 6;
    const winningScore = 5;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;

      const heightAdjustment = isMobile ? 80 : 0;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight - heightAdjustment;

      state.ballX = canvas.width / 2;
      state.ballY = canvas.height / 2;
      state.paddleY = (canvas.height - paddleHeight) / 2;
      state.aiPaddleY = (canvas.height - paddleHeight) / 2;
    };
    

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const resetBall = () => {
      if (state.playerScore >= winningScore || state.aiScore >= winningScore) {
        const playerWon = state.playerScore >= winningScore;
        setIsRunning(false);
        // Award points if player won
        if (playerWon) {
          handleGameWin("Ping Pong");
        }
        state.playerScore = 0;
        state.aiScore = 0;
        return;
      }
      state.ballX = canvas.width / 2;
      state.ballY = canvas.height / 2;
      state.ballSpeedX = -state.ballSpeedX;
      state.ballSpeedY = Math.random() * 6 - 3;
    };

    let cachedBgGradient: CanvasGradient | null = null;
    let gridPattern: CanvasPattern | null = null;

    const createPatterns = () => {
      cachedBgGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        50,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
      );
      cachedBgGradient.addColorStop(0, "#181818");
      cachedBgGradient.addColorStop(1, "#000");

      const patternCanvas = document.createElement("canvas");
      const patternSize = isMobile ? 30 : 40;
      patternCanvas.width = patternSize;
      patternCanvas.height = patternSize;
      const patternCtx = patternCanvas.getContext("2d");
      if (!patternCtx) return;

      patternCtx.strokeStyle = "rgba(0, 255, 255, 0.2)";
      patternCtx.beginPath();
      patternCtx.moveTo(0, 0);
      patternCtx.lineTo(0, patternSize);
      patternCtx.moveTo(0, 0);
      patternCtx.lineTo(patternSize, 0);
      patternCtx.stroke();

      gridPattern = ctx.createPattern(patternCanvas, "repeat");
    };

    createPatterns();

    const draw = () => {
      if (!cachedBgGradient || !gridPattern) return;

      ctx.fillStyle = cachedBgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = gridPattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0ff";
      for (let i = 0; i < canvas.height; i += isMobile ? 15 : 20) {
        ctx.fillRect(canvas.width / 2 - 1, i, 2, isMobile ? 7 : 10);
      }

      ctx.shadowBlur = isMobile ? 10 : 15;
      ctx.shadowColor = "#0ff";
      ctx.fillStyle = "#0ff";
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f00";
      ctx.shadowColor = "#f00";
      ctx.fillRect(0, state.paddleY, paddleWidth, paddleHeight);

      ctx.fillStyle = "#f0f";
      ctx.shadowColor = "#f0f";
      ctx.fillRect(
        canvas.width - paddleWidth,
        state.aiPaddleY,
        paddleWidth,
        paddleHeight
      );
      ctx.shadowBlur = 0;

      ctx.font = isMobile ? "24px sans-serif" : "30px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText(state.playerScore.toString(), canvas.width / 4, 50);
      ctx.fillText(state.aiScore.toString(), (canvas.width * 3) / 4, 50);
    };

    const gameLoop = (timestamp: number) => {
      if (!isRunning) return;

      if (previousTimeRef.current === undefined) {
        previousTimeRef.current = timestamp;
      }

      const elapsed = timestamp - previousTimeRef.current;
      if (elapsed > 16) {
        previousTimeRef.current = timestamp;

        updateGameState();
        draw();
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    const updateGameState = () => {
      state.ballX += state.ballSpeedX;
      state.ballY += state.ballSpeedY;

      if (state.ballY + ballRadius > canvas.height || state.ballY - ballRadius < 0) {
        state.ballSpeedY = -state.ballSpeedY;
      }

      if (state.ballX - ballRadius < paddleWidth) {
        if (state.ballY > state.paddleY && state.ballY < state.paddleY + paddleHeight) {
          state.ballSpeedX = -state.ballSpeedX;
          let deltaY = state.ballY - (state.paddleY + paddleHeight / 2);
          state.ballSpeedY = deltaY * 0.35;
        } else {
          state.aiScore++;
          resetBall();
        }
      } else if (state.ballX + ballRadius > canvas.width - paddleWidth) {
        if (state.ballY > state.aiPaddleY && state.ballY < state.aiPaddleY + paddleHeight) {
          state.ballSpeedX = -state.ballSpeedX;
          let deltaY = state.ballY - (state.aiPaddleY + paddleHeight / 2);
          state.ballSpeedY = deltaY * 0.35;
        } else {
          state.playerScore++;
          resetBall();
          // addPoints(10);
        }
      }

      const paddleCenter = state.aiPaddleY + paddleHeight / 2;
      if (paddleCenter < state.ballY - 15) {
        state.aiPaddleY += paddleSpeed * (isMobile ? 0.7 : 0.8);
      } else if (paddleCenter > state.ballY + 15) {
        state.aiPaddleY -= paddleSpeed * (isMobile ? 0.7 : 0.8);
      }

      if (state.aiPaddleY < 0) state.aiPaddleY = 0;
      if (state.aiPaddleY > canvas.height - paddleHeight) state.aiPaddleY = canvas.height - paddleHeight;

      if (state.upPressed && state.paddleY > 0) {
        state.paddleY -= paddleSpeed;
      }
      if (state.downPressed && state.paddleY < canvas.height - paddleHeight) {
        state.paddleY += paddleSpeed;
      }
    };

    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") {
        state.upPressed = true;
      } else if (e.key === "ArrowDown" || e.key === "s") {
        state.downPressed = true;
      }
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") {
        state.upPressed = false;
      } else if (e.key === "ArrowDown" || e.key === "s") {
        state.downPressed = false;
      }
    };

    if (!isRunning) {
      state.ballX = canvas.width / 2;
      state.ballY = canvas.height / 2;
      state.paddleY = (canvas.height - paddleHeight) / 2;
      state.aiPaddleY = (canvas.height - paddleHeight) / 2;
      draw();
    }

    if (isRunning) {
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener("keydown", keyDownHandler);
      window.removeEventListener("keyup", keyUpHandler);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [isRunning, isMobile]);
  const directionKeyMap: Record<Direction, "upPressed" | "downPressed"> = {
  up: "upPressed",
  down: "downPressed",
};


const handleButtonDown = (direction: Direction): void => {
  gameStateRef.current[directionKeyMap[direction]] = true;
};

const handleButtonUp = (direction: Direction): void => {
  gameStateRef.current[directionKeyMap[direction]] = false;
};


  return (
    <div className={styles["pong-container"]} ref={containerRef}>
      <video autoPlay muted loop playsInline className={styles.backgroundVideo}>
        <source src="/video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {isMobile && isRunning && (
        <div className={styles["control-buttons"]}>
          <button
            className={styles["control-button"] + " " + styles["control-button-up"]}
            onTouchStart={() => handleButtonDown("up")}
            onTouchEnd={() => handleButtonUp("up")}
          >
            UP
          </button>
        </div>
      )}
      <canvas ref={canvasRef} />
      {isMobile && isRunning && (
        <div className={styles["control-buttons"]}>
          <button
            className={styles["control-button"] + " " + styles["control-button-down"]}
            onTouchStart={() => handleButtonDown("down")}
            onTouchEnd={() => handleButtonUp("down")}
          >
            DOWN
          </button>
        </div>
      )}
      {!isRunning && (
        <>
          <button
            className={styles["start-button"]}
            onClick={() => {
              setIsRunning(true);
              const state = gameStateRef.current;
              state.playerScore = 0;
              state.aiScore = 0;
            }}
            disabled={isSearchingMatch}
          >
            {isMobile ? "Tap to Start" : "Start Game (vs AI)"}
          </button>

          <button
            className={styles["start-button"]}
            onClick={isSearchingMatch ? cancelMatchSearchHandler : findMatchHandler}
            style={{ marginTop: "10px", backgroundColor: isSearchingMatch ? "#f44336" : "#4CAF50" }}
          >
            {isSearchingMatch ? "Cancel Search" : "Find Match (Multiplayer)"}
          </button>

          {matchStatus && (
            <div style={{ 
              marginTop: "20px", 
              padding: "10px", 
              backgroundColor: "rgba(0,0,0,0.7)", 
              color: "white",
              borderRadius: "5px",
              textAlign: "center"
            }}>
              {matchStatus}
            </div>
          )}

          <button className={styles["back-button"]} onClick={() => {
            if (isSearchingMatch) {
              cancelMatchSearchHandler();
            }
            navigate('/Games');
          }}>
            Back
          </button>
        </>
      )}
    </div>
  );
};

export default PongNeon;