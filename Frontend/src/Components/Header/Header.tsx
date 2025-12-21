import S from "./Header.module.css";
import { FiBell } from "react-icons/fi";
import { IoLanguageOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPoints } from "../../utils/points";

type User = {
  name?: string;
  surname?: string;
  email?: string;
  username?: string;
  avatarSeed?: string;
};

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [points, setPoints] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Проверяем авторизацию при каждом рендере
  useEffect(() => {
    const auth = localStorage.getItem("isAuth") === "true";
    setIsAuth(auth);
    setPoints(getPoints());
    
    // Load user data for avatar
    if (auth) {
      try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error("Error loading user:", e);
      }
    }
  }, []);

  // Update points when they change
  useEffect(() => {
    const handleStorageChange = () => {
      setPoints(getPoints());
    };

    const handleGameWin = () => {
      setPoints(getPoints());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("game-win" as any, handleGameWin);
    window.addEventListener("achievement-unlocked" as any, handleGameWin);

    // Also check periodically for same-tab updates
    const interval = setInterval(() => {
      setPoints(getPoints());
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("game-win" as any, handleGameWin);
      window.removeEventListener("achievement-unlocked" as any, handleGameWin);
      clearInterval(interval);
    };
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
        <Link to="/AISimulation">Trai</Link>
        <Link to="/News">News</Link>
      </nav>

      <div className={S.right}>
        {isAuth && (
          <Link to="/Wallet" className={S.pointsDisplay}>
            <span className={S.pointsIcon}>⭐️</span>
            <span className={S.pointsAmount}>{points}</span>
          </Link>
        )}

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
            {isAuth && user?.avatarSeed ? (
              <img
                src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.avatarSeed}`}
                alt="Profile"
                className={S.avatar}
              />
            ) : (
              <FaUser className={S.registerIcon} />
            )}
          </button>
        </Link>
      </div>
    </header>
  );
}

