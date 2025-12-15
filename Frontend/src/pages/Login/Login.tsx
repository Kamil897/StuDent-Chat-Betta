import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import S from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      setError("Пользователь не найден");
      return;
    }

    const user = JSON.parse(savedUser);

    if (user.username === username && user.password === password) {
      localStorage.setItem("isAuth", "true");
      navigate("/profile");
    } else {
      setError("Неверное имя пользователя или пароль");
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

          <button className={S.loginBtn} onClick={handleLogin}>
            Войти
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
