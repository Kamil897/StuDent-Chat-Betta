import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import S from "./Register.module.css";
import EmailVerification from "../EmailVerification/EmailVerification";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function Register() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    if (!isChecked) {
      setError("Необходимо согласиться с политикой конфиденциальности");
      return;
    }

    // Валидация
    if (!formData.name.trim() || !formData.email.trim() || !formData.username.trim() || !formData.password.trim()) {
      setError("Заполните все обязательные поля");
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Отправляем запрос на backend
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          surname: formData.surname.trim() || undefined,
          email: formData.email.trim(),
          username: formData.username.trim(),
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка при регистрации");
      }

      const data = await response.json();
      console.log("[Register] Registration successful, received data:", {
        hasTokens: !!data.tokens,
        hasAccessToken: !!data.tokens?.accessToken,
        hasUser: !!data.user,
        userEmailVerified: data.user?.emailVerified,
      });

      // Сохраняем токены и пользователя
      if (data.tokens?.accessToken) {
        localStorage.setItem("accessToken", data.tokens.accessToken);
        console.log("[Register] Access token saved");
      } else {
        console.warn("[Register] No access token in response");
      }
      if (data.tokens?.refreshToken) {
        localStorage.setItem("refreshToken", data.tokens.refreshToken);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isAuth", "true");
        console.log("[Register] User data saved, emailVerified:", data.user.emailVerified);
      }

      // Добавляем пользователя в лидерборд
      const { getOrCreateLeaderboardUser, removeDuplicates } = await import("../../utils/leaderboard");
      getOrCreateLeaderboardUser(
        data.user.id,
        data.user.username,
        `${data.user.name} ${data.user.surname || ""}`.trim(),
        data.user.email,
        data.user.avatarSeed
      );
      removeDuplicates();

      // Показываем форму верификации
      setRegisteredEmail(formData.email.trim());
      setShowVerification(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Ошибка при регистрации. Проверьте подключение к серверу");
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = () => {
    // Обновляем пользователя в localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      user.emailVerified = true;
      localStorage.setItem("user", JSON.stringify(user));
    }

    // Переходим в профиль
    navigate("/profile");
  };

  // Если показываем верификацию, рендерим её
  if (showVerification) {
    return <EmailVerification email={registeredEmail} onVerified={handleVerified} />;
  }

  return (
    <div className={S.wrapper}>
      <div className={S.left}>
        <div className={S.card}>
          <h1>Добро пожаловать!</h1>

          {error && <p className={S.error}>{error}</p>}

          <label>
            Имя
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Введите имя"
            />
          </label>

          <label>
            Фамилия
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              placeholder="Введите фамилию"
            />
          </label>

          <label>
            Почта
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Введите почту"
            />
          </label>

          <label>
            Имя пользователя
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Придумайте имя пользователя"
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Придумайте надёжный пароль"
            />
          </label>

          <div className={S.checkbox}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
            />
            <span>
              Я ознакомлен и согласен с{" "}
              <button
                type="button"
                className={S.Policybtn}
                onClick={() => setIsModalOpen(true)}
              >
                политикой и конфиденциальностью
              </button>
            </span>
          </div>

          <button
            className={S.regBtn}
            disabled={!isChecked || loading}
            onClick={handleRegister}
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>

          <p className={S.loginText}>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>

      {/* МОДАЛКА — ПОЛНОСТЬЮ КАК У ТЕБЯ */}
      {isModalOpen && (
        <div
          className={S.modalOverlay}
          onClick={() => setIsModalOpen(false)}
        >
          <div className={S.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Политика и конфиденциальность</h2>

            <p>
              1. ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ (ПУБЛИЧНАЯ ОФЕРТА)
              <br /><br />
              1. Общие положения
              <br />
              1.1. Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между Обществом с ограниченной ответственностью «STUDENT-CHAT» (ООО «STUDENT-CHAT»), далее — «Оператор», и пользователем сети Интернет (далее — «Пользователь»).
              <br />
              1.2. Использование веб-SaaS сервиса означает полное и безоговорочное принятие условий настоящего Соглашения.
              <br />
              1.3. Применимое право — право Республики Узбекистан.
              <br /><br />

              2. Предмет
              <br />
              2.1. Оператор предоставляет Пользователю доступ к функционалу веб-SaaS сервиса.
              <br /><br />

              3. Права и обязанности Пользователя
              <br />
              3.1. Пользователь обязуется использовать Сервис исключительно в законных целях.
              <br /><br />

              4. Интеллектуальная собственность
              <br />
              4.1. Все исключительные права принадлежат Оператору.
              <br /><br />

              5. Ответственность
              <br />
              5.1. Сервис предоставляется «как есть».
              <br /><br />

              6. Заключительные положения
              <br />
              6.1. Оператор вправе изменять условия.
              <br /><br />

              ⸻
              <br /><br />

              2. ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ
              <br />
              Оператор обрабатывает персональные данные в соответствии с законом Республики Узбекистан.
              <br /><br />

              ⸻
              <br /><br />

              СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ
              <br />
              Я даю согласие на обработку моих персональных данных.
            </p>

            <button onClick={() => setIsModalOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
