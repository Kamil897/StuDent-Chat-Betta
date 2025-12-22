import S from "./Header.module.css";
import { FiBell } from "react-icons/fi";
import { IoLanguageOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPoints } from "../../utils/points";
import { useLanguage } from "../../Context/LanguageContext";
import { useTranslation } from "react-i18next";

export default function Header() {
  const { changeLanguage, language } = useLanguage();
  const { t } = useTranslation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [points, setPoints] = useState(0);

  const bellRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAuth(localStorage.getItem("isAuth") === "true");
    setPoints(getPoints());
  }, []);

  // Закрытие при клике вне
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (
        !bellRef.current?.contains(e.target as Node) &&
        !langRef.current?.contains(e.target as Node)
      ) {
        setShowNotifications(false);
        setShowLang(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className={S.header}>
      <nav className={S.nav}>
        <Link to="/">{t("nav.home")}</Link>
        <Link to="/AiChat">{t("nav.ai")}</Link>
        <Link to="/AISimulation">{t("nav.trai")}</Link>
        <Link to="/News">{t("nav.news")}</Link>
      </nav>

      <div className={S.right}>
        {isAuth && (
          <Link to="/Wallet" className={S.pointsDisplay}>
            ⭐️ {points}
          </Link>
        )}

        {/* 🌍 Language */}
        <div className={S.langWrapper} ref={langRef}>
          <IoLanguageOutline
            className={S.icon}
            onClick={() => setShowLang((p) => !p)}
          />

          <div
            className={`${S.langMenu} ${
              showLang ? S.langOpen : ""
            }`}
          >
            <button
              className={language === "ru" ? S.activeLang : ""}
              onClick={() => changeLanguage("ru")}
            >
              RU
            </button>
            <button
              className={language === "en" ? S.activeLang : ""}
              onClick={() => changeLanguage("en")}
            >
              EN
            </button>
            <button
              className={language === "uz" ? S.activeLang : ""}
              onClick={() => changeLanguage("uz")}
            >
              UZ
            </button>
          </div>
        </div>

        {/* 🔔 Notifications */}
        <div className={S.bellWrapper} ref={bellRef}>
          <FiBell
            className={S.icon}
            onClick={() => setShowNotifications((p) => !p)}
          />
          {showNotifications && (
            <div className={S.notifications}>
              <div className={S.notificationItem} >{t("notifications.one")}</div>
              <div className={S.notificationItem} >{t("notifications.two")}</div>
              <div className={S.notificationItem} >{t("notifications.three")}</div>
            </div>
          )}
        </div>

        <Link to={isAuth ? "/profile" : "/register"}>
          <button className={S.registerButton}>
            <FaUser />
          </button>
        </Link>
      </div>
    </header>
  );
}
