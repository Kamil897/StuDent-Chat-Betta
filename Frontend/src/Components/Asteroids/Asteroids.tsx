import { useEffect, useRef, useState } from 'react';
import styles from './asteroid.module.css';
import { useNavigate } from 'react-router-dom';
import { handleGameWin } from '../../utils/gameRewards';

/* ===== TYPES ===== */
type Ship = {
  x: number;
  y: number;
  angle: number;
  velocityX: number;
  velocityY: number;
  size: number;
};

type Asteroid = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  sides: number;
  angle: number;
  rotationSpeed: number;
};

type Bullet = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  lifetime: number;
};

type GameState = {
  score: number;
  gameOver: boolean;
};

const Doom: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    gameOver: false,
  });

  const [numAsteroids, setNumAsteroids] = useState<number>(10);
  const [shipColor, setShipColor] = useState<string>('#ffffff');
  const [asteroidColor, setAsteroidColor] = useState<string>('#aaaaaa');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const shipRef = useRef<Ship>({
    x: 400,
    y: 300,
    angle: 0,
    velocityX: 0,
    velocityY: 0,
    size: 15,
  });

  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const animationFrameIdRef = useRef<number | null>(null);

  const TAU = Math.PI * 2;

  /* ===== KEYBOARD ===== */
  useEffect(() => {
    const down = (e: KeyboardEvent) => (keysRef.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keysRef.current[e.code] = false);

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  /* ===== ASTEROID FACTORY ===== */
  const createAsteroid = (): Asteroid => {
    const size = Math.random() * 30 + 20;
    let asteroid: Asteroid;

    do {
      asteroid = {
        x: Math.random() * 1000,
        y: Math.random() * 600,
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: (Math.random() - 0.5) * 2,
        size,
        sides: Math.floor(Math.random() * 5 + 5),
        angle: Math.random() * TAU,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
      };
    } while (
      Math.hypot(
        asteroid.x - shipRef.current.x,
        asteroid.y - shipRef.current.y
      ) <
      shipRef.current.size + asteroid.size + 100
    );

    return asteroid;
  };

  /* ===== GAME LOOP ===== */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 600;

    asteroidsRef.current = Array.from({ length: numAsteroids }, createAsteroid);

    const drawShip = () => {
      const ship = shipRef.current;
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);

      ctx.beginPath();
      ctx.moveTo(ship.size, 0);
      ctx.lineTo(-ship.size, ship.size / 2);
      ctx.lineTo(-ship.size, -ship.size / 2);
      ctx.closePath();
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = shipColor;
      ctx.stroke();

      ctx.restore();
    };

    const drawAsteroid = (a: Asteroid) => {
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const angle = (i / 20) * TAU;
        const r = a.size * (0.8 + Math.random() * 0.4);
        const x = a.x + Math.cos(angle + a.angle) * r;
        const y = a.y + Math.sin(angle + a.angle) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = asteroidColor;
      ctx.stroke();
      ctx.fillStyle = `${asteroidColor}88`;
      ctx.fill();
    };

    const drawBullet = (b: Bullet) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, TAU);
      ctx.fillStyle = 'white';
      ctx.fill();
    };

    const updateShip = () => {
      const s = shipRef.current;

      if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) {
        s.velocityX += Math.cos(s.angle) * 0.1;
        s.velocityY += Math.sin(s.angle) * 0.1;
      }
      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) s.angle -= 0.05;
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) s.angle += 0.05;

      s.velocityX *= 0.99;
      s.velocityY *= 0.99;

      s.x = (s.x + s.velocityX + canvas.width) % canvas.width;
      s.y = (s.y + s.velocityY + canvas.height) % canvas.height;

      if (keysRef.current['Space'] && bulletsRef.current.length < 5) {
        bulletsRef.current.push({
          x: s.x,
          y: s.y,
          velocityX: Math.cos(s.angle) * 5,
          velocityY: Math.sin(s.angle) * 5,
          lifetime: 100,
        });
      }
    };

    const updateAsteroids = () => {
      asteroidsRef.current.forEach(a => {
        a.x = (a.x + a.velocityX + canvas.width) % canvas.width;
        a.y = (a.y + a.velocityY + canvas.height) % canvas.height;
        a.angle += a.rotationSpeed;
      });
    };

    const updateBullets = () => {
      bulletsRef.current = bulletsRef.current.filter(b => {
        b.x += b.velocityX;
        b.y += b.velocityY;
        b.lifetime--;
        return b.lifetime > 0;
      });
    };

    const checkCollisions = () => {
      const ship = shipRef.current;

      asteroidsRef.current.forEach(a => {
        if (Math.hypot(ship.x - a.x, ship.y - a.y) < ship.size + a.size) {
          setGameState(prev => ({ ...prev, gameOver: true }));
        }
      });

      // Use reverse iteration to safely remove elements
      for (let bi = bulletsRef.current.length - 1; bi >= 0; bi--) {
        const b = bulletsRef.current[bi];
        for (let ai = asteroidsRef.current.length - 1; ai >= 0; ai--) {
          const a = asteroidsRef.current[ai];
          if (Math.hypot(b.x - a.x, b.y - a.y) < a.size) {
            bulletsRef.current.splice(bi, 1);
            asteroidsRef.current.splice(ai, 1);
            setGameState(prev => {
              const newScore = prev.score + 10;
              const newState = { ...prev, score: newScore };
              
              // Check if all asteroids are destroyed (win condition)
              // Check after removing the asteroid
              if (asteroidsRef.current.length === 0 && !prev.gameOver) {
                // All asteroids destroyed - player wins!
                handleGameWin("Asteroids");
                return { ...newState, gameOver: true };
              }
              
              return newState;
            });
            break; // Bullet hit an asteroid, no need to check other asteroids
          }
        }
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (gameState.gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        return;
      }

      drawShip();
      updateShip();
      updateAsteroids();
      updateBullets();
      checkCollisions();

      asteroidsRef.current.forEach(drawAsteroid);
      bulletsRef.current.forEach(drawBullet);

      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${gameState.score}`, 10, 30);

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameState.gameOver, numAsteroids, shipColor, asteroidColor]);

  /* ===== RESET ===== */
  const resetGame = () => {
    shipRef.current = {
      x: 400,
      y: 300,
      angle: 0,
      velocityX: 0,
      velocityY: 0,
      size: 15,
    };
    asteroidsRef.current = Array.from({ length: numAsteroids }, createAsteroid);
    bulletsRef.current = [];
    setGameState({ score: 0, gameOver: false });
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>ASTEROIDS</div>

      <div className={styles.gameControlBar}>
        <button onClick={resetGame}>Start</button>
        <button onClick={() => navigate('/Games')}>Exit</button>
        <button
          className={styles.settingsToggle}
          onClick={() => setShowSettings(p => !p)}
        >
          ⚙️ Settings
        </button>
      </div>

      {showSettings && (
        <div className={styles.controls}>
          <label>
            Asteroids:
            <input
              type="number"
              min={1}
              max={30}
              value={numAsteroids}
              onChange={e => setNumAsteroids(+e.target.value)}
            />
          </label>

          <label>
            Ship color:
            <input
              type="color"
              value={shipColor}
              onChange={e => setShipColor(e.target.value)}
            />
          </label>

          <label>
            Asteroid color:
            <input
              type="color"
              value={asteroidColor}
              onChange={e => setAsteroidColor(e.target.value)}
            />
          </label>
        </div>
      )}

      <canvas ref={canvasRef} className={styles.canvas} />

      {gameState.gameOver && (
        <button className={styles.restartButton} onClick={resetGame}>
          Restart
        </button>
      )}
    </div>
  );
};

export default Doom;
