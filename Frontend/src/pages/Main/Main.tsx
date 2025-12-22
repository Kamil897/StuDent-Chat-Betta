import About from "../../Components/About/About";
import Card from "../../Components/Card/Card";
import S from "./Main.module.css";
import { useTranslation } from "react-i18next";

export default function Main() {
  const { t } = useTranslation();

  return (
    <div className={S.landingPage}>
      {/* HERO */}
      <div className={S.hero}>
        <h1>{t("main.hero.title")}</h1>
        <p>{t("main.hero.subtitle")}</p>
      </div>

      <About />

      {/* CARDS */}
      <div className={S.Cards}>
        <h1 className={S.CardsTitle}>{t("main.cards.title")}</h1>

        <div className={S.CardsWrapper}>
          <Card
            title={t("main.cards.items.communication.title")}
            text={t("main.cards.items.communication.text")}
          />

          <Card
            title={t("main.cards.items.flexibility.title")}
            text={t("main.cards.items.flexibility.text")}
          />

          <Card
            title={t("main.cards.items.skills.title")}
            text={t("main.cards.items.skills.text")}
          />
        </div>
      </div>

      {/* WHY US */}
      <div className={S.whyUs}>
        <h1>{t("main.why.title")}</h1>

        <div className={S.whyGrid}>
          <div className={S.bigBlurCard}>
            <div className={S.blurBlob}></div>
            <img src="/whybig.png" alt="Big" />
            <h2>{t("main.why.big.title")}</h2>
            <p>{t("main.why.big.text")}</p>
          </div>

          <div className={S.rightColumn}>
            <div className={S.smallCardGreen}>
              <img src="/whygreen.png" alt="Green" />
              <div className={S.smallText}>
                <h3>{t("main.why.green.title")}</h3>
                <p>{t("main.why.green.text")}</p>
              </div>
            </div>

            <div className={S.smallCardPink}>
              <img src="/whypink.png" alt="Pink" />
              <div className={S.smallText}>
                <h3>{t("main.why.pink.title")}</h3>
                <p>{t("main.why.pink.text")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW TO */}
      <div className={S.howTo}>
        <h1>{t("main.how.title")}</h1>

        <div className={S.howTopBoxes}>
          <div className={S.stepLarge}>
            <span>01</span>
            <h3>{t("main.how.steps.1.title")}</h3>
            <p>{t("main.how.steps.1.text")}</p>
          </div>

          <div className={S.stepLarge}>
            <span>02</span>
            <h3>{t("main.how.steps.2.title")}</h3>
            <p>{t("main.how.steps.2.text")}</p>
          </div>
        </div>

        <div className={S.howBottomBoxes}>
          <div className={S.stepSmall}>
            <span>03</span>
            <h3>{t("main.how.steps.3.title")}</h3>
            <p>{t("main.how.steps.3.text")}</p>
          </div>

          <div className={S.stepSmall}>
            <span>04</span>
            <h3>{t("main.how.steps.4.title")}</h3>
            <p>{t("main.how.steps.4.text")}</p>
          </div>

          <div className={S.stepSmall}>
            <span>05</span>
            <h3>{t("main.how.steps.5.title")}</h3>
            <p>{t("main.how.steps.5.text")}</p>
          </div>
        </div>

        <p className={S.disclaimer}>{t("main.how.disclaimer")}</p>
      </div>
    </div>
  );
}
