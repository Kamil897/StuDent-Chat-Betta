import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import S from "./Register.module.css";

export default function Register() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

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
    if (!isChecked) return;

    // 🎲 РАНДОМНЫЙ seed для аватара (1 раз при регистрации)
    const avatarSeed = crypto.randomUUID();
    // Use email as stable ID, fallback to username
    const userId = formData.email 
      ? `user_${formData.email.replace(/[^a-zA-Z0-9]/g, '_')}`
      : formData.username
      ? `user_${formData.username.replace(/[^a-zA-Z0-9]/g, '_')}`
      : `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const user = {
      ...formData,
      id: userId,
      avatarSeed,
    };

    // сохраняем пользователя
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("isAuth", "true");
    
    // Добавляем пользователя в лидерборд (или обновляем существующего)
    const { getOrCreateLeaderboardUser, removeDuplicates } = await import("../../utils/leaderboard");
    getOrCreateLeaderboardUser(
      userId,
      formData.username,
      `${formData.name} ${formData.surname}`.trim(),
      formData.email,
      avatarSeed
    );
    // Remove any duplicates
    removeDuplicates();

    // очистка формы
    setFormData({
      name: "",
      surname: "",
      email: "",
      username: "",
      password: "",
    });

    navigate("/profile");
  };

  return (
    <div className={S.wrapper}>
      <div className={S.left}>
        <div className={S.card}>
          <h1>Добро пожаловать!</h1>

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
            disabled={!isChecked}
            onClick={handleRegister}
          >
            Зарегистрироваться
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
