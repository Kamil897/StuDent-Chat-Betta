import S from "./About.module.css"

export default function About() {
  return (
    <div className={S.about}>
      <div className={S.aboutText}>
        <h1>О НАС</h1>

        <p>
        STUDENT-CHAT — это современная образовательная платформа, созданная для поддержки студентов на всех этапах обучения и подготовки к поступлению в вузы. Мы объединяем технологии и экспертный опыт для эффективного и персонализированного образования.
        </p>
      </div>

      <img className={S.aboutImg} src="about.png" alt="about" />
    </div>
  );
}
