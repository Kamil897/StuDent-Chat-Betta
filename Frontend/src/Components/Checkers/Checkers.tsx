import React, { useState, useEffect, useRef } from 'react';
import { handleGameWin } from '../../utils/gameRewards';
import styles from './Checkers.module.css';

type Piece = 'red' | 'black' | 'redKing' | 'blackKing' | null;

interface Square {
  piece: Piece;
  isDark: boolean;
}

type Board = Square[][];

const Checkers: React.FC = () => {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'black'>('red');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'red' | 'black' | null>(null);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const gameStartedRef = useRef(false);

  function initializeBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isDark = (row + col) % 2 === 1;
        let piece: Piece = null;
        
        if (isDark) {
          if (row < 3) {
            piece = 'black';
          } else if (row > 4) {
            piece = 'red';
          }
        }
        
        board[row][col] = { piece, isDark };
      }
    }
    
    return board;
  }

  useEffect(() => {
    if (!gameStartedRef.current) {
      gameStartedRef.current = true;
    }

    if (gameOver || !gameStartedRef.current) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setWinner(currentPlayer === 'red' ? 'black' : 'red');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, currentPlayer]);

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) return;

    const square = board[row][col];

    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;
      const selectedPiece = board[selectedRow][selectedCol].piece;
      
      if (selectedPiece && (selectedPiece === currentPlayer || selectedPiece === `${currentPlayer}King` as Piece)) {
        if (isValidMove(selectedRow, selectedCol, row, col)) {
          const newBoard = board.map(r => [...r]);
          const piece = newBoard[selectedRow][selectedCol].piece;
          
          // Move piece
          newBoard[row][col].piece = piece;
          newBoard[selectedRow][selectedCol].piece = null;
          
          // Check for king promotion
          if (piece === 'red' && row === 0) {
            newBoard[row][col].piece = 'redKing';
          } else if (piece === 'black' && row === 7) {
            newBoard[row][col].piece = 'blackKing';
          }
          
          // Check for capture
          const rowDiff = row - selectedRow;
          const colDiff = col - selectedCol;
          if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
            const capturedRow = selectedRow + rowDiff / 2;
            const capturedCol = selectedCol + colDiff / 2;
            newBoard[capturedRow][capturedCol].piece = null;
          }
          
          setBoard(newBoard);
          setSelectedSquare(null);
          setMoves(prev => prev + 1);
          setCurrentPlayer(prev => prev === 'red' ? 'black' : 'red');
          
          // Check for win
          const redPieces = newBoard.flat().filter(sq => sq.piece === 'red' || sq.piece === 'redKing').length;
          const blackPieces = newBoard.flat().filter(sq => sq.piece === 'black' || sq.piece === 'blackKing').length;
          
          if (redPieces === 0) {
            setGameOver(true);
            setWinner('black');
            handleGameWin('Checkers');
          } else if (blackPieces === 0) {
            setGameOver(true);
            setWinner('red');
            handleGameWin('Checkers');
          }
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      if (square.piece && (square.piece === currentPlayer || square.piece === `${currentPlayer}King` as Piece)) {
        setSelectedSquare([row, col]);
      }
    }
  };

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol].piece;
    const targetSquare = board[toRow][toCol];
    
    if (!targetSquare.isDark || targetSquare.piece !== null) return false;
    
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    
    if (piece === 'red' || piece === 'redKing') {
      if (piece === 'red' && rowDiff >= 0) return false; // Red moves up
      if (Math.abs(rowDiff) === 1 && colDiff === 1) return true;
      if (Math.abs(rowDiff) === 2 && colDiff === 2) {
        const middleRow = fromRow + rowDiff / 2;
        const middleCol = fromCol + (toCol - fromCol) / 2;
        const middlePiece = board[middleRow][middleCol].piece;
        return middlePiece === 'black' || middlePiece === 'blackKing';
      }
    }
    
    if (piece === 'black' || piece === 'blackKing') {
      if (piece === 'black' && rowDiff <= 0) return false; // Black moves down
      if (Math.abs(rowDiff) === 1 && colDiff === 1) return true;
      if (Math.abs(rowDiff) === 2 && colDiff === 2) {
        const middleRow = fromRow + rowDiff / 2;
        const middleCol = fromCol + (toCol - fromCol) / 2;
        const middlePiece = board[middleRow][middleCol].piece;
        return middlePiece === 'red' || middlePiece === 'redKing';
      }
    }
    
    return false;
  };

  const getPieceSymbol = (piece: Piece): string => {
    switch (piece) {
      case 'red': return '🔴';
      case 'black': return '⚫';
      case 'redKing': return '👑';
      case 'blackKing': return '👑';
      default: return '';
    }
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer('red');
    setGameOver(false);
    setWinner(null);
    setMoves(0);
    setTimeLeft(300);
    gameStartedRef.current = false;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>⚫ Шашки ⚫</h1>
        <div className={styles.info}>
          <div className={styles.timer}>⏱️ {formatTime(timeLeft)}</div>
          <div className={styles.moves}>Ходов: {moves}</div>
          <div className={styles.currentPlayer}>
            Ход: <span className={currentPlayer === 'red' ? styles.red : styles.black}>
              {currentPlayer === 'red' ? 'Красные' : 'Черные'}
            </span>
          </div>
        </div>
      </div>

      {gameOver && (
        <div className={styles.gameOver}>
          <h2>Игра окончена!</h2>
          <p>Победитель: {winner === 'red' ? 'Красные' : 'Черные'}</p>
          <button onClick={resetGame}>Новая игра</button>
        </div>
      )}

      <div className={styles.board}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((square, colIndex) => {
              const isSelected = selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${styles.square} ${square.isDark ? styles.dark : styles.light} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {square.piece && (
                    <span className={`${styles.piece} ${square.piece.includes('red') ? styles.redPiece : styles.blackPiece}`}>
                      {getPieceSymbol(square.piece)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button onClick={resetGame} className={styles.resetBtn}>🔄 Новая игра</button>
      </div>
    </div>
  );
};

export default Checkers;
