import { Link } from 'react-router-dom';
import s from './Footer.module.css';

const Footer = () => {

  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.center} aria-hidden={false}>
          <blockquote className={s.quote}>
            Учись. Общайся. Развивайся.
          </blockquote>
        </div>
        <nav className={s.nav}>
          <Link to="/AISimulation">IELTS симулятор</Link>
          <Link to="/AiChat">Cognia AI</Link>
          <Link to="/profile">Мой аккаунт</Link>
        </nav>
      </div>
      <div className={s.bottom}>
        <span>© 2025 OOO STUDENTCHAT.Все права защищены.</span>
        <p>contact@student-chat.online</p>
      </div>
    </footer>
  );
};

export default Footer;