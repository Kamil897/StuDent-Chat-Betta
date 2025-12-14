import { Link } from "react-router-dom";
import S from "./Login.module.css";

export default function Login() {
  return (
    <div className={S.wrapper}>
      <div className={S.left}>
        <div className={S.card}>
          <h1>Добро пожаловать!</h1>

          <label>
            Имя пользователя
            <input type="text" placeholder="Введите имя пользователя" />
          </label>

          <label>
            Пароль
            <input type="password" placeholder="Введите ваш пароль" />
          </label>

          <button className={S.loginBtn}>Войти</button>

          <p className={S.registerText}>
            Ещё нет аккаунта? <Link to={"/register"}>Зарегистрироваться</Link>
          </p>
        </div>
      </div>

      <div className={S.right}>
        <div className={S.blob}></div>
      </div>
    </div>
  );
}
