import S from "./Header.module.css";
import { FiBell } from "react-icons/fi";
import { IoLanguageOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Проверяем авторизацию при каждом рендере
  useEffect(() => {
    const auth = localStorage.getItem("isAuth") === "true";
    setIsAuth(auth);
  }, []);

  // Закрытие уведомлений при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const notifications = [
    "New message from Alice",
    "Your IELTS simulation is ready",
    "Cognia Ai updated",
  ];

  return (
    <header className={S.header}>
      <nav className={S.nav}>
        <Link to="/">STUDENT CHAT</Link>
        <Link to="/AiChat">Cognia Ai</Link>
        <Link to="/AISimulation">IELTS simulation</Link>
        <Link to="/News">News</Link>
      </nav>

      <div className={S.right}>
        <IoLanguageOutline className={S.icon} />

        <div className={S.bellWrapper} ref={bellRef}>
          <FiBell
            className={S.icon}
            onClick={() => setShowNotifications((prev) => !prev)}
          />
          {showNotifications && (
            <div className={S.notifications}>
              {notifications.map((note, index) => (
                <div key={index} className={S.notificationItem}>
                  {note}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🔥 Умная кнопка профиля */}
        <Link to={isAuth ? "/profile" : "/register"}>
          <button className={S.registerButton}>
            <FaUser className={S.registerIcon} />
          </button>
        </Link>
      </div>
    </header>
  );
}
