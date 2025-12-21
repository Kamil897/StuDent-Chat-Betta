import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import S from "./Profile.module.css";

type User = {
  name: string;
  surname: string;
  email: string;
  username: string;
  avatarSeed: string; // ✅ добавили
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuth") === "true";
    const savedUser = localStorage.getItem("user");

    if (!isAuth || !savedUser) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(savedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    navigate("/login");
  };

  if (!user) return null;

  // 🎯 СТАБИЛЬНЫЙ АВАТАР (тот же, что выдался при регистрации)
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.avatarSeed}`;

  return (
    <div className={S.wrapper}>
      <div className={S.container}>
        {/* Левая карточка */}
        <div className={S.profileCard}>
          
          {/* АВАТАР */}
          <img
            src={avatarUrl}
            alt="avatar"
            className={S.avatar}
          />

          <h2>{user.name}</h2>

          <div className={S.info}>
            <p>
              <strong>Имя:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
          </div>
        </div>

        {/* Правая панель */}
        <div className={S.menuCard}>
          <ul className={S.menu}>
            <li><a href="/Leaderboard">Leaderboard</a></li>
          </ul>

          <span className={S.line}></span>

          <ul className={S.menu}>
            <li><a href="/Shop">Магазин</a></li>
            <li><a href="/games">Игры</a></li>
            <li><a href="/Wallet">Кошелёк</a></li>
            <li><a href="/">Достижения</a></li>
            <li><a href="/Chat">Друзья и чаты</a></li>
          </ul>

          <span className={S.line}></span>

          <ul className={S.menu}>
            <li className={S.logout} onClick={handleLogout}>
              Выйти из аккаунта
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
