import S from "./Header.module.css";
import { FiBell } from "react-icons/fi";
import { IoLanguageOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaExclamationTriangle } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPoints } from "../../utils/points";
import { useLanguage } from "../../Context/LanguageContext";
import { useTranslation } from "react-i18next";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  type Notification,
} from "../../utils/notifications";

export default function Header() {
  const { changeLanguage, language } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [points, setPoints] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const bellRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAuth(localStorage.getItem("isAuth") === "true");
    setPoints(getPoints());
    
    // Load notifications
    const loadNotifications = () => {
      const notifs = getNotifications();
      setNotifications(notifs);
      setUnreadCount(getUnreadCount());
    };
    
    loadNotifications();
    
    // Listen for notification updates
    const handleNotificationUpdate = () => {
      loadNotifications();
    };
    
    window.addEventListener("notifications-updated", handleNotificationUpdate);
    
    return () => {
      window.removeEventListener("notifications-updated", handleNotificationUpdate);
    };
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
        <Link to="/news">{t("nav.news")}</Link>
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
          <div style={{ position: "relative" }}>
            <FiBell
              className={S.icon}
              onClick={() => setShowNotifications((p) => !p)}
            />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  backgroundColor: "#ff4444",
                  color: "white",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          {showNotifications && (
            <div className={S.notifications}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid #eee" }}>
                <strong>Уведомления</strong>
                <div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        markAllAsRead();
                        setUnreadCount(0);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#007bff",
                        cursor: "pointer",
                        fontSize: "12px",
                        marginRight: "10px",
                      }}
                    >
                      Отметить все как прочитанные
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "18px",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                    Нет уведомлений
                  </div>
                ) : (
                  [...notifications].reverse().map((notif) => (
                    <div
                      key={notif.id}
                      className={`${S.notificationItem} ${!notif.read ? S.unread : ""}`}
                      onClick={() => {
                        if (!notif.read) {
                          markAsRead(notif.id);
                          setUnreadCount(getUnreadCount());
                        }
                        if (notif.link) {
                          navigate(notif.link);
                          setShowNotifications(false);
                        }
                      }}
                      style={{
                        cursor: notif.link ? "pointer" : "default",
                        backgroundColor: notif.read ? "transparent" : "#f0f8ff",
                        padding: "12px",
                        borderBottom: "1px solid #eee",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{notif.icon || "🔔"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: notif.read ? "normal" : "bold", marginBottom: "4px" }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: "13px", color: "#666" }}>{notif.message}</div>
                        <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
                          {new Date(notif.createdAt).toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                          setNotifications(getNotifications());
                          setUnreadCount(getUnreadCount());
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "16px",
                          cursor: "pointer",
                          color: "#999",
                          padding: "0 5px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ⚠️ Complaints */}
        {isAuth && (
          <Link to="/complaints" className={S.icon} title={t("nav.complaints") || "Жалобы"}>
            <FaExclamationTriangle />
          </Link>
        )}

        <Link to={isAuth ? "/profile" : "/register"}>
          <button className={S.registerButton}>
            <FaUser />
          </button>
        </Link>
      </div>
    </header>
  );
}
