import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import S from "./Login.module.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Пытаемся войти через backend API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Неверное имя пользователя или пароль");
      }

      const data = await response.json();
      
      // Сохраняем токены
      if (data.tokens?.accessToken) {
        localStorage.setItem("accessToken", data.tokens.accessToken);
      }
      if (data.tokens?.refreshToken) {
        localStorage.setItem("refreshToken", data.tokens.refreshToken);
      }

      // Сохраняем информацию о пользователе
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isAuth", "true");
        
        // Если email не подтвержден, показываем предупреждение
        if (!data.user.emailVerified) {
          alert("Ваш email не подтвержден. Некоторые функции могут быть недоступны. Проверьте почту для подтверждения.");
        }
      }

      navigate("/profile");
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Fallback: локальная авторизация
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.username === username && user.password === password) {
          localStorage.setItem("isAuth", "true");
          navigate("/profile");
          return;
        }
      }
      
      setError(err.message || "Неверное имя пользователя или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={S.wrapper}>
      <div className={S.left}>
        <div className={S.card}>
          <h1>Добро пожаловать!</h1>

          <label>
            Имя пользователя
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите ваш пароль"
            />
          </label>

          {error && <p className={S.error}>{error}</p>}

          <button className={S.loginBtn} onClick={handleLogin} disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>

          <p className={S.registerText}>
            Ещё нет аккаунта?{" "}
            <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>

      <div className={S.right}>
        <div className={S.blob}></div>
      </div>
    </div>
  );
}
