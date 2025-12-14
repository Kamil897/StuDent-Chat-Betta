import S from "./Header.module.css";
import { FiBell } from "react-icons/fi";
import { IoLanguageOutline } from "react-icons/io5";

export default function Header() {
  return (
    <header className={S.header}>
      <nav className={S.nav}>
        <a href="/">STUDENT CHAT</a>
        <a href="/AiChat">Cognia Ai</a>
        <a href="/AISimulation">IELTS simulation</a>
      </nav>

      <div className={S.right}>
        <IoLanguageOutline className={S.icon} />
        <FiBell className={S.icon} />
      </div>
    </header>
  );
}
