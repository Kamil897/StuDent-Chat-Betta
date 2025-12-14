import About from "../../Components/About/About"
import Card from "../../Components/Card/Card"
import S from "./Main.module.css"

export default function Main() {
    return (
        <div className={S.landingPage}>

            <div className={S.hero}>
                <h1>STUDENT CHAT</h1>
                <p>место помощи — кому?</p>
            </div>

            <About />

            {/* ===== CARDS BLOCK ===== */}
            <div className={S.Cards}>
                <h1 className={S.CardsTitle}>КАК МЫ МОЖЕМ ПОМОЧЬ</h1>

                <div className={S.CardsWrapper}>
                    <Card
                        title="Общение и взаимопомощь"
                        text="Мы не просто платформа для информации — мы место, где каждый может делиться своим опытом и вдохновляться историей других."
                    />

                    <Card
                        title="Гибкость в обучении"
                        text="Вы сами выбираете, как учиться: участвовать в онлайн-занятиях, проходить тесты или смотреть записи уроков."
                    />

                    <Card
                        title="Развитие навыков"
                        text="Помимо поступления, мы помогаем развивать навыки, которые пригодятся в жизни и учёбе."
                    />
                </div>
            </div>

            {/* ===== WHY CHOOSE US ===== */}
            <div className={S.whyUs}>
                <h1>ПОЧЕМУ ВЫБИРАЮТ НАС?</h1>

                <div className={S.whyGrid}>

                    <div className={S.bigBlurCard}>
                        <div className={S.blurBlob}></div>
                        <img src="/whybig.png" alt="Big" />
                        <h2>Доступность 24/7</h2>
                        <p>
                            Мы всегда на связи! вы можете задавать вопросы, получать поддержку и находить ответы тогда, когда это вам удобно.
                        </p>
                    </div>

                    <div className={S.rightColumn}>
                        <div className={S.smallCardGreen}>
                            <img src="/whygreen.png" alt="Big" width={184} height={184}/>
                            <div className={S.smallText}>
                                <h3>Безопасное и доброжелательное
                                пространство</h3>
                                <p>
                                Мы следим за тем, чтобы общение на платформе было комфортным. Здесь вы можете быть собой, делиться идеям и и мнениями без страха быть осуждённым.
                                </p>    
                            </div>
                        </div>

                        <div className={S.smallCardPink}>
                            <img src="/whypink.png" alt="Big" width={184} height={184}/>
                            <div className={S.smallText}>
                                <h3>Лучшие наставники</h3>
                                <p>
                                    Опытные специалисты помогут разобраться в сложных темах, составить учебный план и даже подготовить вас к важным экзаменам.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ===== HOW TO USE AI ===== */}
            <div className={S.howTo}>
                <h1>КАК ПРАВИЛЬНО ИСПОЛЬЗОВАТЬ ИИ ДЛЯ УЧЁБЫ</h1>

                {/* Верхние шаги */}
                <div className={S.howTopBoxes}>
                    <div className={S.stepLarge}>
                        <span>01</span>
                        <h3>Сформулируй вопрос</h3>
                        <p>
                        Формулируйте вопросы максимально конкретно и ясно
                        </p>
                    </div>

                    <div className={S.stepLarge}>
                        <span>02</span>
                        <h3>Уточняй детали</h3>
                        <p>
                        Используйте возможность уточнений и дополнительных объяснений.
                        </p>
                    </div>
                </div>

                {/* Нижние шаги */}
                <div className={S.howBottomBoxes}>
                    <div className={S.stepSmall}>
                        <span>03</span>
                        <h3>Получай ответ и учись</h3>
                        <p>
                        Применяйте полученные знания на практике, решайте задачи и тесты.
                        </p>
                    </div>

                    <div className={S.stepSmall}>
                        <span>04</span>
                        <h3>Применяй знания</h3>
                        <p>
                        Рассматривайте Cognia как инструмент развития, а не shortcut в обучении.
                        </p>
                    </div>

                    <div className={S.stepSmall}>
                        <span>05</span>
                        <h3>Используй ИИ правильно</h3>
                        <p>
                            ИИ — это помощник. Он создан для понимания тем и развития, 
                            а не для списывания или обмана.
                        </p>
                    </div>
                </div>

                <p className={S.disclaimer}>ИИ — инструмент, который помогает учиться, а не заменяет обучение.</p>
            </div>

        </div>
    )
}
