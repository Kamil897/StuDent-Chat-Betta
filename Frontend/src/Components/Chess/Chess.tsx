import React, { useState, useEffect, useRef } from 'react';
import { handleGameWin } from '../../utils/gameRewards';
import styles from './Chess.module.css';

type Piece = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king' | null;
type Color = 'white' | 'black';

interface Square {
  piece: Piece;
  color: Color;
}

type Board = Square[][];

const Chess: React.FC = () => {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Color>('white');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Color | null>(null);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const gameStartedRef = useRef(false);

  function initializeBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Initialize pawns
    for (let i = 0; i < 8; i++) {
      board[1][i] = { piece: 'pawn', color: 'black' };
      board[6][i] = { piece: 'pawn', color: 'white' };
    }
    
    // Initialize other pieces
    const backRow: Piece[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let i = 0; i < 8; i++) {
      board[0][i] = { piece: backRow[i], color: 'black' };
      board[7][i] = { piece: backRow[i], color: 'white' };
    }
    
    // Empty squares
    for (let row = 2; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        board[row][col] = { piece: null, color: (row + col) % 2 === 0 ? 'white' : 'black' };
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
          setWinner(currentPlayer === 'white' ? 'black' : 'white');
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
      
      if (selectedPiece && board[selectedRow][selectedCol].color === currentPlayer) {
        // Try to move
        if (isValidMove(selectedRow, selectedCol, row, col)) {
          const newBoard = board.map(r => [...r]);
          newBoard[row][col] = newBoard[selectedRow][selectedCol];
          newBoard[selectedRow][selectedCol] = { piece: null, color: (selectedRow + selectedCol) % 2 === 0 ? 'white' : 'black' };
          
          setBoard(newBoard);
          setSelectedSquare(null);
          setMoves(prev => prev + 1);
          setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white');
          
          // Check for checkmate (simplified - when king is captured)
          const opponentColor = currentPlayer === 'white' ? 'black' : 'white';
          const opponentKing = newBoard.flat().find(sq => sq.piece === 'king' && sq.color === opponentColor);
          if (!opponentKing) {
            setGameOver(true);
            setWinner(currentPlayer);
            handleGameWin('Chess');
          }
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      if (square.piece && square.color === currentPlayer) {
        setSelectedSquare([row, col]);
      }
    }
  };

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol].piece;
    const color = board[fromRow][fromCol].color;
    const targetSquare = board[toRow][toCol];

    if (targetSquare.piece && targetSquare.color === color) return false;

    // Simplified move validation
    switch (piece) {
      case 'pawn':
        const direction = color === 'white' ? -1 : 1;
        if (fromCol === toCol && !targetSquare.piece) {
          return toRow === fromRow + direction || (fromRow === (color === 'white' ? 6 : 1) && toRow === fromRow + 2 * direction);
        }
        return Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && targetSquare.piece !== null;
      
      case 'rook':
        return (fromRow === toRow || fromCol === toCol) && isPathClear(fromRow, fromCol, toRow, toCol);
      
      case 'knight':
        return (Math.abs(toRow - fromRow) === 2 && Math.abs(toCol - fromCol) === 1) ||
               (Math.abs(toRow - fromRow) === 1 && Math.abs(toCol - fromCol) === 2);
      
      case 'bishop':
        return Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol) && isPathClear(fromRow, fromCol, toRow, toCol);
      
      case 'queen':
        return ((fromRow === toRow || fromCol === toCol) || 
                (Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol))) && 
               isPathClear(fromRow, fromCol, toRow, toCol);
      
      case 'king':
        return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
      
      default:
        return false;
    }
  };

  const isPathClear = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const rowStep = toRow === fromRow ? 0 : (toRow > fromRow ? 1 : -1);
    const colStep = toCol === fromCol ? 0 : (toCol > fromCol ? 1 : -1);
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol].piece !== null) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const getPieceSymbol = (piece: Piece, color: Color): string => {
    if (!piece) return '';
    const symbols: Record<string, Record<Color, string>> = {
      pawn: { white: '♙', black: '♟' },
      rook: { white: '♖', black: '♜' },
      knight: { white: '♘', black: '♞' },
      bishop: { white: '♗', black: '♝' },
      queen: { white: '♕', black: '♛' },
      king: { white: '♔', black: '♚' },
    };
    return symbols[piece]?.[color] || '';
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer('white');
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
        <h1>♔ Шахматы ♔</h1>
        <div className={styles.info}>
          <div className={styles.timer}>⏱️ {formatTime(timeLeft)}</div>
          <div className={styles.moves}>Ходов: {moves}</div>
          <div className={styles.currentPlayer}>
            Ход: <span className={currentPlayer === 'white' ? styles.white : styles.black}>
              {currentPlayer === 'white' ? 'Белые' : 'Черные'}
            </span>
          </div>
        </div>
      </div>

      {gameOver && (
        <div className={styles.gameOver}>
          <h2>Игра окончена!</h2>
          <p>Победитель: {winner === 'white' ? 'Белые' : 'Черные'}</p>
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
                  className={`${styles.square} ${square.color === 'white' ? styles.light : styles.dark} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {square.piece && (
                    <span className={`${styles.piece} ${square.color === 'white' ? styles.whitePiece : styles.blackPiece}`}>
                      {getPieceSymbol(square.piece, square.color)}
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

export default Chess;
