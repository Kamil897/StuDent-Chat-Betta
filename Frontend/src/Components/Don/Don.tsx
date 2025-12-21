import React, { useState, useEffect } from "react";
import s from "./DonDon.module.css";
import { useNavigate } from 'react-router-dom';


interface Choice {
  name: string;
  image: string;
}

interface GameState {
  playerChoice: Choice | null;
  computerChoice: Choice | null;
  result: string;
  wins: number;
  ties: number;
  losses: number;
}

type GameResult = "tie" | "win" | "lose";

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

  const [rpsWins, setRpsWins] = useState<number>(0);
  const navigate = useNavigate();


  const [gameState, setGameState] = useState<GameState>({
    playerChoice: null,
    computerChoice: null,
    result: "",
    wins: 0,
    ties: 0,
    losses: 0,
  });

  useEffect(() => {
    localStorage.setItem('rpsWins', gameState.wins.toString());
  }, [gameState.wins]);

  useEffect(() => {
    const savedWins = parseInt(localStorage.getItem('rpsWins') || '0', 10) || 0;
    setRpsWins(savedWins);
  }, []);

  const handlePlayerChoice = (choice: Choice) => {
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    const gameResult = getResult(choice.name, randomChoice.name);

    setGameState((prev) => {
      const newWins = gameResult === "win" ? prev.wins + 1 : prev.wins;
      
      // Award points for win
      if (gameResult === "win") {
        const { handleGameWin } = require("../../utils/gameRewards");
        handleGameWin("TicTacToe");
      }
      const newTies = gameResult === "tie" ? prev.ties + 1 : prev.ties;
      const newLosses = gameResult === "lose" ? prev.losses + 1 : prev.losses;

      // if (gameResult === "win") {
      //   addPoints(1);
      // }

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

  useEffect(() => {
    if (gameState.wins >= 30) {
      const title = 'rps';
      const titles: string[] = JSON.parse(localStorage.getItem('titlesUnlocked') || '[]');

      if (!titles.includes(title)) {
        const updated = [...titles, title];
        localStorage.setItem('titlesUnlocked', JSON.stringify(updated));
        console.log(`🏆 Титул получен: ${('titles.rps.title')}`);
      }
    }
  }, [gameState.wins, ]);

  const { playerChoice, computerChoice, result, wins, ties, losses } = gameState;

  return (
    <div className={s.game}>
      <button className={s.backButton} onClick={() => navigate('/Games')}>
        <svg height="16" width="16" viewBox="0 0 1024 1024">
          <path d="..." />
        </svg>
        <span>{("rps.back")}</span>
      </button>

      <h1>{("rps.title")}</h1>

      <div className={s.scoreboard}>
        <ScoreboardItem label={("rps.wins")} value={wins} />
        <ScoreboardItem label={("rps.ties")} value={ties} />
        <ScoreboardItem label={("rps.losses")} value={losses} />
      </div>

      {playerChoice && (
        <div className={s.result}>
          <ChoiceDisplay title={("rps.computerChoice")} choice={computerChoice!} />
          <ChoiceDisplay title={("rps.yourChoice")} choice={playerChoice} />
          <h2 className={s.resultText}>{(`rps.result.${result}`)}</h2>
          <h2 className={s.resultText}>{("rps.chooseAgain")}</h2>
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