import React from "react";
import S from "./Card.module.css";

interface CardProps {
  title: string;
  text: string;
}

const Card: React.FC<CardProps> = ({ title, text }) => {
  return (
    <div className={S.card}>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
};

export default Card;
