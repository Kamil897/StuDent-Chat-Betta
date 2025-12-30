import React, { useState, useEffect } from "react";
import s from "./DonDon.module.css";
import { useNavigate } from 'react-router-dom';
import { handleGameWin } from '../../utils/gameRewards';


interface Choice {
  name: string;
  image: string;
}

interface GameState {
  playerChoice: Choice | null;
  computerChoice: Choice | null;
  player2Choice: Choice | null;
  result: string;
  wins: number;
  ties: number;
  losses: number;
  player2Wins: number;
  player2Ties: number;
  player2Losses: number;
}

type GameResult = "tie" | "win" | "lose";
type GameMode = "single" | "multiplayer";

const choices: Choice[] = [
  { name: "Rock", image: '/rock.png' },
  { name: "Paper", image: '/paper.png' },
  { name: "Scissors", image: '/scissors.png' },
];

const getResult = (playerChoice: string, computerChoice: string): GameResult => {
  if (playerChoice === computerChoice) return "tie";
  if (
    (playerChoice === "Rock" && computerChoice === "Scissors") ||
    (playerChoice === "Paper" && computerChoice === "Rock") ||
    (playerChoice === "Scissors" && computerChoice === "Paper")
  ) {
    return "win";
  }
  return "lose";
};

const Don: React.FC = () => {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<GameMode>("single");
  const [waitingForPlayer2, setWaitingForPlayer2] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    playerChoice: null,
    computerChoice: null,
    player2Choice: null,
    result: "",
    wins: 0,
    ties: 0,
    losses: 0,
    player2Wins: 0,
    player2Ties: 0,
    player2Losses: 0,
  });

  useEffect(() => {
    localStorage.setItem('rpsWins', gameState.wins.toString());
    if (gameMode === "multiplayer") {
      localStorage.setItem('rpsPlayer2Wins', gameState.player2Wins.toString());
    }
  }, [gameState.wins, gameState.player2Wins, gameMode]);

  // Мультиплеер через localStorage
  useEffect(() => {
    if (gameMode === "multiplayer") {
      const checkPlayer2Choice = setInterval(() => {
        const stored = localStorage.getItem('rpsPlayer2Choice');
        if (stored && waitingForPlayer2) {
          const choice = JSON.parse(stored);
          setGameState(prev => {
            if (!prev.player2Choice) {
              setPlayer2Ready(true);
              return { ...prev, player2Choice: choice };
            }
            return prev;
          });
        }
      }, 100);

      return () => clearInterval(checkPlayer2Choice);
    }
  }, [gameMode, waitingForPlayer2]);

  const handlePlayerChoice = (choice: Choice) => {
    if (gameMode === "multiplayer") {
      // Сохраняем выбор игрока 1
      localStorage.setItem('rpsPlayer1Choice', JSON.stringify(choice));
      setGameState(prev => ({ ...prev, playerChoice: choice }));
      setWaitingForPlayer2(true);
      return;
    }

    // Одиночный режим
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    const gameResult = getResult(choice.name, randomChoice.name);

    setGameState((prev) => {
      const newWins = gameResult === "win" ? prev.wins + 1 : prev.wins;
      
      if (gameResult === "win") {
        handleGameWin("Rock Paper Scissors");
      }
      const newTies = gameResult === "tie" ? prev.ties + 1 : prev.ties;
      const newLosses = gameResult === "lose" ? prev.losses + 1 : prev.losses;

      return {
        ...prev,
        playerChoice: choice,
        computerChoice: randomChoice,
        result: gameResult,
        wins: newWins,
        ties: newTies,
        losses: newLosses,
      };
    });
  };

  const handlePlayer2Choice = (choice: Choice) => {
    if (gameMode === "multiplayer") {
      localStorage.setItem('rpsPlayer2Choice', JSON.stringify(choice));
      setGameState(prev => {
        const player1Choice = prev.playerChoice;
        if (player1Choice) {
          const gameResult = getResult(player1Choice.name, choice.name);
          const player1Wins = gameResult === "win" ? prev.wins + 1 : prev.wins;
          const player2Wins = gameResult === "lose" ? prev.player2Wins + 1 : prev.player2Wins;
          const ties = gameResult === "tie" ? prev.ties + 1 : prev.ties;
          
          if (gameResult === "win") {
            handleGameWin("Rock Paper Scissors");
          }

          setWaitingForPlayer2(false);
          setPlayer2Ready(false);
          localStorage.removeItem('rpsPlayer1Choice');
          localStorage.removeItem('rpsPlayer2Choice');

          return {
            ...prev,
            player2Choice: choice,
            computerChoice: choice,
            result: gameResult,
            wins: player1Wins,
            player2Wins: player2Wins,
            ties: ties,
          };
        }
        return { ...prev, player2Choice: choice };
      });
    }
  };

  const resetRound = () => {
    setGameState(prev => ({
      ...prev,
      playerChoice: null,
      computerChoice: null,
      player2Choice: null,
      result: "",
    }));
    setWaitingForPlayer2(false);
    setPlayer2Ready(false);
    localStorage.removeItem('rpsPlayer1Choice');
    localStorage.removeItem('rpsPlayer2Choice');
  };

  useEffect(() => {
    if (gameState.wins >= 30) {
      const title = 'rps';
      const titles: string[] = JSON.parse(localStorage.getItem('titlesUnlocked') || '[]');

      if (!titles.includes(title)) {
        const updated = [...titles, title];
        localStorage.setItem('titlesUnlocked', JSON.stringify(updated));
        console.log(`🏆 Титул получен: RPS Master`);
      }
    }
  }, [gameState.wins, ]);

  const { playerChoice, computerChoice, player2Choice, result, wins, ties, losses, player2Wins, player2Ties, player2Losses } = gameState;

  return (
    <div className={s.game}>
      <button className={s.backButton} onClick={() => navigate('/Games')}>
        <svg height="16" width="16" viewBox="0 0 1024 1024">
          <path d="..." />
        </svg>
        <span>Back</span>
      </button>

      <h1>Rock Paper Scissors</h1>

      <div className={s.modeSelector}>
        <button 
          className={`${s.modeButton} ${gameMode === "single" ? s.active : ""}`}
          onClick={() => {
            setGameMode("single");
            resetRound();
          }}
        >
          Single Player
        </button>
        <button 
          className={`${s.modeButton} ${gameMode === "multiplayer" ? s.active : ""}`}
          onClick={() => {
            setGameMode("multiplayer");
            resetRound();
          }}
        >
          Multiplayer
        </button>
      </div>

      {gameMode === "multiplayer" ? (
        <>
          <div className={s.scoreboard}>
            <div className={s.playerScore}>
              <h3>Player 1</h3>
              <ScoreboardItem label="Wins" value={wins} />
              <ScoreboardItem label="Ties" value={ties} />
              <ScoreboardItem label="Losses" value={losses} />
            </div>
            <div className={s.playerScore}>
              <h3>Player 2</h3>
              <ScoreboardItem label="Wins" value={player2Wins} />
              <ScoreboardItem label="Ties" value={player2Ties} />
              <ScoreboardItem label="Losses" value={player2Losses} />
            </div>
          </div>

          {waitingForPlayer2 && !player2Ready ? (
            <div className={s.waitingMessage}>
              <p>Player 1 has chosen! Player 2, make your choice!</p>
            </div>
          ) : null}

          {playerChoice && player2Choice && (
            <div className={s.result}>
              <ChoiceDisplay title="Player 1" choice={playerChoice} />
              <ChoiceDisplay title="Player 2" choice={player2Choice} />
              <h2 className={s.resultText}>
                {result === "win" ? "Player 1 Wins!" : 
                 result === "lose" ? "Player 2 Wins!" : "It's a Tie!"}
              </h2>
              <button className={s.playAgainButton} onClick={resetRound}>
                Play Again
              </button>
            </div>
          )}

          <div className={s.choices}>
            {choices.map((choice) => (
              <button
                key={choice.name}
                onClick={() => {
                  if (!playerChoice || waitingForPlayer2) {
                    handlePlayerChoice(choice);
                  } else if (!player2Choice) {
                    handlePlayer2Choice(choice);
                  }
                }}
                className={s.choiceButton}
                disabled={waitingForPlayer2 && !player2Ready && !playerChoice}
                aria-label={`Select ${choice.name}`}
              >
                <img src={choice.image} alt={choice.name} className={s.choiceImage} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={s.scoreboard}>
            <ScoreboardItem label="Wins" value={wins} />
            <ScoreboardItem label="Ties" value={ties} />
            <ScoreboardItem label="Losses" value={losses} />
          </div>

          {playerChoice && (
            <div className={s.result}>
              <ChoiceDisplay title="Computer Choice" choice={computerChoice!} />
              <ChoiceDisplay title="Your Choice" choice={playerChoice} />
              <h2 className={s.resultText}>
                {result === "win" ? "You Win!" : result === "lose" ? "You Lose!" : "Tie!"}
              </h2>
              <h2 className={s.resultText}>Choose Again</h2>
            </div>
          )}

          <div className={s.choices}>
            {choices.map((choice) => (
              <button
                key={choice.name}
                onClick={() => handlePlayerChoice(choice)}
                className={s.choiceButton}
                aria-label={`Select ${choice.name}`}
              >
                <img src={choice.image} alt={choice.name} className={s.choiceImage} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface ScoreboardItemProps {
  label: string;
  value: number;
}

const ScoreboardItem: React.FC<ScoreboardItemProps> = ({ label, value }) => (
  <p className={s.scoreItem}>
    {label}: <span>{value}</span>
  </p>
);

interface ChoiceDisplayProps {
  title: string;
  choice: Choice;
}

const ChoiceDisplay: React.FC<ChoiceDisplayProps> = ({ title, choice }) => (
  <div className={s.choiceDisplay}>
    <p>{title}: {choice.name}</p>
    <img src={choice.image} alt={choice.name} className={s.resultImage} />
  </div>
);

export default Don;