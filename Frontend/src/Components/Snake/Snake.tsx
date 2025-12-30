import React, { useState, useEffect, useRef } from 'react';
import s from './Snake.module.scss';
import { handleGameWin } from '../../utils/gameRewards';

const TILE_SIZE = 20;
const ROWS = 20;
const COLS = 20;
const INITIAL_SNAKE = [
  { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) },
  { x: Math.floor(COLS / 2) - 1, y: Math.floor(ROWS / 2) },
  { x: Math.floor(COLS / 2) - 2, y: Math.floor(ROWS / 2) },
];
const INITIAL_DIRECTION = 'e';
const GAME_DURATION = 60;


function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(generateFood(INITIAL_SNAKE));
  const [, setDirection] = useState(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  const getGameSpeed = () => {
    switch (difficulty) {
      case 'easy': return 200;
      case 'medium': return 150;
      case 'hard': return 100;
      default: return 150;
    }
  };
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('snakeBestScore') || '0');
  });

  const gameLoopRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const pendingDirectionRef = useRef(INITIAL_DIRECTION);

  useEffect(() => {
    const preventScroll = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventScroll);
    return () => window.removeEventListener('keydown', preventScroll);
  }, []);

  useEffect(() => {
    if (!isGameStarted || isGameOver) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsPaused((prev) => !prev);
        return;
      }
      const newDirection = getDirection(e.key);
      if (newDirection && newDirection !== getOppositeDirection(pendingDirectionRef.current)) {
        pendingDirectionRef.current = newDirection;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted, isGameOver]);

  useEffect(() => {
    if (!isGameStarted || isGameOver || isPaused) return;
    const moveSnake = () => {
      setSnake((prevSnake) => {
        const currentDirection = pendingDirectionRef.current;
        setDirection(currentDirection);
        const head = prevSnake[0];
        const newHead = getNextPosition(head, currentDirection);

        if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
          endGame();
          return prevSnake;
        }
        if (checkSelfCollision(newHead, prevSnake)) {
          endGame();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((prev) => prev + 1);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    };
    const speed = getGameSpeed();
    gameLoopRef.current = window.setInterval(moveSnake, speed);
    return () => clearInterval(gameLoopRef.current!);
  }, [isGameStarted, isGameOver, isPaused, difficulty, food]);

  useEffect(() => {
    if (!isGameStarted || isGameOver || isPaused) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [isGameStarted, isGameOver, isPaused]);

  const endGame = () => {
    setIsGameOver(true);
    setIsGameStarted(false);
    clearInterval(gameLoopRef.current!);
    clearInterval(timerRef.current!);
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('snakeBestScore', score.toString());
    }
    // Award points based on score
    if (score >= 10) {
      handleGameWin("Snake");
    }
  };

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood(INITIAL_SNAKE));
    setDirection(INITIAL_DIRECTION);
    pendingDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsGameOver(false);
    setIsPaused(false);
    setIsGameStarted(true);
  };

  const togglePause = () => setIsPaused((prev) => !prev);


  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isGameStarted || isPaused) return;
    e.preventDefault();
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      const newDir = diffX > 0 ? 'e' : 'w';
      if (newDir !== getOppositeDirection(pendingDirectionRef.current)) {
        pendingDirectionRef.current = newDir;
      }
    } else if (Math.abs(diffY) > 30) {
      const newDir = diffY > 0 ? 's' : 'n';
      if (newDir !== getOppositeDirection(pendingDirectionRef.current)) {
        pendingDirectionRef.current = newDir;
      }
    }
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  return (
    <div className={s.app}>
      {!isGameStarted ? (
        <div className={s.menu}>
          <h1>🐍 Snake</h1>
          <button onClick={startGame}>
            {isGameOver ? 'Play Again' : 'Start Game'}
          </button>
          {isGameOver && <p>Game Over! Score: {score}, Best: {bestScore}</p>}
          <div>
            <label>Difficulty:</label>
            {(['easy','medium','hard'] as const).map((level) => (
              <button key={level} onClick={() => setDifficulty(level)}>{level}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className={s.boardWrapper}>
          <div
            className={s.board}
            style={{ width: `${COLS * TILE_SIZE}px`, height: `${ROWS * TILE_SIZE}px` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {snake.map((segment, idx) => (
              <div key={idx} className={s.snake} style={{
                left: `${segment.x * TILE_SIZE}px`,
                top: `${segment.y * TILE_SIZE}px`,
                width: TILE_SIZE,
                height: TILE_SIZE
              }}/>
            ))}
            <div className={s.food} style={{
              left: `${food.x * TILE_SIZE}px`,
              top: `${food.y * TILE_SIZE}px`,
              width: TILE_SIZE,
              height: TILE_SIZE
            }}/>
          </div>
          <button onClick={togglePause}>{isPaused ? '▶️ Resume' : '⏸️ Pause'}</button>
          <button onClick={() => { setIsGameStarted(false); setIsGameOver(false); }}>Exit</button>
          <p>Score: {score}, Time: {timeLeft}s, Best: {bestScore}</p>
        </div>
      )}
    </div>
  );
}

function getNextPosition(head: {x:number,y:number}, dir:string) {
  switch(dir){
    case 'n': return {x: head.x, y: head.y-1};
    case 's': return {x: head.x, y: head.y+1};
    case 'e': return {x: head.x+1, y: head.y};
    case 'w': return {x: head.x-1, y: head.y};
    default: return head;
  }
}

function checkSelfCollision(newHead:{x:number,y:number}, snake:any[]) {
  return snake.some(s => s.x === newHead.x && s.y === newHead.y);
}

function generateFood(snake:any[]) {
  let foodPos: { x: any; y: any; };
  do {
    foodPos = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
  } while(snake.some(s => s.x===foodPos.x && s.y===foodPos.y));
  return foodPos;
}

function getDirection(key:string) {
  const keyMap:any = { ArrowUp:'n', w:'n', W:'n', ArrowDown:'s', s:'s', S:'s', ArrowLeft:'w', a:'w', A:'w', ArrowRight:'e', d:'e', D:'e'};
  return keyMap[key]||null;
}

function getOppositeDirection(dir:string){
  const opposites:any = { n:'s', s:'n', e:'w', w:'e' };
  return opposites[dir];
}

export default SnakeGame;
