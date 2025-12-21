import React, { useState, useEffect, useCallback } from 'react';
import styles from './Minesweeper.module.css';
import { handleGameWin } from '../../utils/gameRewards';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
}

const difficultySettings: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

const Minesweeper: React.FC = () => {

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [flagCount, setFlagCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const config = difficultySettings[difficulty];

  const createEmptyBoard = useCallback((): Cell[][] => {
    return Array(config.rows)
      .fill(null)
      .map(() =>
        Array(config.cols)
          .fill(null)
          .map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0,
          }))
      );
  }, [config.rows, config.cols]);

  const placeMines = useCallback((board: Cell[][], firstClickRow: number, firstClickCol: number): Cell[][] => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    let minesPlaced = 0;

    while (minesPlaced < config.mines) {
      const row = Math.floor(Math.random() * config.rows);
      const col = Math.floor(Math.random() * config.cols);

      const isFirstClickArea =
        Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1;

      if (!newBoard[row][col].isMine && !isFirstClickArea) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (!newBoard[row][col].isMine) {
          newBoard[row][col].neighborMines = countNeighborMines(newBoard, row, col);
        }
      }
    }

    return newBoard;
  }, [config.rows, config.cols, config.mines]);

  const countNeighborMines = (board: Cell[][], row: number, col: number): number => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (
          newRow >= 0 &&
          newRow < config.rows &&
          newCol >= 0 &&
          newCol < config.cols &&
          board[newRow][newCol].isMine
        ) {
          count++;
        }
      }
    }
    return count;
  };

const revealCell = useCallback((board: Cell[][], row: number, col: number): Cell[][] => {
    const newBoard = board.map(r => r.map(c => ({ ...c })));
    const toReveal: [number, number][] = [[row, col]];
    const visited = new Set<string>();

    while (toReveal.length > 0) {
      const [r, c] = toReveal.shift()!;
      const key = `${r},${c}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (
        r < 0 ||
        r >= config.rows ||
        c < 0 ||
        c >= config.cols ||
        newBoard[r][c].isRevealed ||
        newBoard[r][c].isFlagged
      ) {
        continue;
      }

      newBoard[r][c].isRevealed = true;

      if (newBoard[r][c].neighborMines === 0 && !newBoard[r][c].isMine) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            toReveal.push([r + i, c + j]);
          }
        }
      }
    }

    return newBoard;
  }, [config.rows, config.cols]);

  const handleCellClick = (row: number, col: number) => {
    if (gameStatus !== 'playing' || board[row][col].isFlagged) return;

    if (!isTimerRunning) {
      setIsTimerRunning(true);
      if (board.every(r => r.every(c => !c.isMine))) {
        const boardWithMines = placeMines(board, row, col);
        const revealed = revealCell(boardWithMines, row, col);
        setBoard(revealed);
        return;
      }
    }

    if (board[row][col].isMine) {
      const newBoard = board.map(r =>
        r.map(c => ({ ...c, isRevealed: c.isMine ? true : c.isRevealed }))
      );
      setBoard(newBoard);
      setGameStatus('lost');
      setIsTimerRunning(false);
      return;
    }

    const revealed = revealCell(board, row, col);
    setBoard(revealed);

    const allNonMinesRevealed = revealed.every((row) =>
      row.every((cell) => cell.isMine || cell.isRevealed)
    );

    if (allNonMinesRevealed && gameStatus === 'playing') {
      setGameStatus('won');
      setIsTimerRunning(false);
      // Award points for win
      handleGameWin("Minesweeper");
    }
  };

  const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gameStatus !== 'playing' || board[row][col].isRevealed) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    setBoard(newBoard);
    setFlagCount(prev => newBoard[row][col].isFlagged ? prev + 1 : prev - 1);
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setGameStatus('playing');
    setFlagCount(0);
    setTimer(0);
    setIsTimerRunning(false);
  };

  useEffect(() => {
    resetGame();
  }, [difficulty]);

useEffect(() => {
  let interval: ReturnType<typeof setInterval> | undefined;

  if (isTimerRunning && gameStatus === 'playing') {
    interval = setInterval(() => {
      setTimer(prev => Math.min(prev + 1, 999));
    }, 1000);
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [isTimerRunning, gameStatus]);


  const getCellContent = (cell: Cell) => {
    if (!cell.isRevealed) {
      return cell.isFlagged ? '🚩' : '';
    }
    if (cell.isMine) {
      return '💣';
    }
    return cell.neighborMines > 0 ? cell.neighborMines : '';
  };

  const getCellClass = (cell: Cell) => {
    if (!cell.isRevealed) {
      return styles.cellHidden;
    }
    if (cell.isMine) {
      return styles.cellMine;
    }
    return `${styles.cellRevealed} ${styles[`cell${cell.neighborMines}`]}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.game}>
        <div className={styles.header}>
          <h1 className={styles.title}>Minesweeper</h1>
        </div>

        <div className={styles.controls}>
          <div className={styles.difficultyButtons}>
            {(Object.keys(difficultySettings) as Difficulty[]).map((diff) => (
              <button
                key={diff}
                className={`${styles.difficultyButton} ${
                  difficulty === diff ? styles.active : ''
                }`}
                onClick={() => setDifficulty(diff)}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.gameBoard}>
          <div className={styles.statusBar}>
            <div className={styles.counter}>
              {String(config.mines - flagCount).padStart(3, '0')}
            </div>
            <button
              className={styles.resetButton}
              onClick={resetGame}
            >
              {gameStatus === 'lost' ? '😵' : gameStatus === 'won' ? '😎' : '🙂'}
            </button>
            <div className={styles.counter}>
              {String(timer).padStart(3, '0')}
            </div>
          </div>

          <div className={styles.boardWrapper}>
            <div
              className={styles.board}
              style={{
                gridTemplateColumns: `repeat(${config.cols}, 30px)`,
                gridTemplateRows: `repeat(${config.rows}, 30px)`,
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={`${styles.cell} ${getCellClass(cell)}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
                    disabled={gameStatus !== 'playing'}
                  >
                    {getCellContent(cell)}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

<h2>
  Good Luck
</h2>

<button className={styles.playAgainButton} onClick={resetGame}>
  Start Again
</button>

      </div>
    </div>
  );
};

export default Minesweeper;