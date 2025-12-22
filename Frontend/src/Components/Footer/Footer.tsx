import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import s from "./Footer.module.css";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.center} aria-hidden={false}>
          <blockquote className={s.quote}>
            {t("footer.quote")}
          </blockquote>
        </div>

        <nav className={s.nav}>
          <Link to="/AISimulation">{t("footer.links.ielts")}</Link>
          <Link to="/AiChat">{t("footer.links.ai")}</Link>
          <Link to="/profile">{t("footer.links.account")}</Link>
        </nav>
      </div>

      <div className={s.bottom}>
        <span>{t("footer.rights")}</span>
        <p>{t("footer.contact")}</p>
      </div>
    </footer>
  );
};

export default Footer;
