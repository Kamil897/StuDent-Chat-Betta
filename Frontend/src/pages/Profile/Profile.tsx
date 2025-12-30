import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import S from "./Profile.module.css";

type User = {
  name: string;
  surname: string;
  email: string;
  username: string;
  avatarSeed: string;
};

export default function Profile() {
  const { t } = useTranslation();
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

  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.avatarSeed}`;

  return (
    <div className={S.wrapper}>
      <div className={S.container}>
        {/* Левая карточка */}
        <div className={S.profileCard}>
          <img src={avatarUrl} alt="avatar" className={S.avatar} />

          <h2>{user.name}</h2>

          <div className={S.info}>
            <p>
              <strong>{t("profile.name")}:</strong> {user.name}
            </p>
            <p>
              <strong>{t("profile.email")}:</strong> {user.email}
            </p>
          </div>
        </div>

        {/* Правая панель */}
        <div className={S.menuCard}>
          <ul className={S.menu}>
            <li><a href="/Leaderboard">{t("profile.menu.leaderboard")}</a></li>
          </ul>

          <span className={S.line}></span>

          <ul className={S.menu}>
            <li><a href="/Magaz">{t("profile.menu.shop")}</a></li>
            <li><a href="/games">{t("profile.menu.games")}</a></li>
            <li><a href="/Wallet">{t("profile.menu.wallet")}</a></li>
            <li><a href="/Achievements">{t("profile.menu.achievements")}</a></li>
            <li><a href="/Chat">{t("profile.menu.friends")}</a></li>
          </ul>

          <span className={S.line}></span>

          <ul className={S.menu}>
            <li className={S.logout} onClick={handleLogout}>
              {t("profile.menu.logout")}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
