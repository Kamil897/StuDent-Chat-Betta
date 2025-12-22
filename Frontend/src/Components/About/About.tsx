import S from "./About.module.css"
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();

  return (
    <div className={S.about}>
      <div className={S.aboutText}>
        <h1>{t("about.title")}</h1>

        <p>{t("about.text")}</p>
      </div>

      <img className={S.aboutImg} src="about.png" alt="about" />
    </div>
  );
}
