import { useScrollReveal } from "../hooks/useAnimations";

const features = [
  "Équipe pluridisciplinaire de kinésithérapeutes certifiés et expérimentés",
  "Équipements médicaux de dernière génération pour une rééducation efficace",
  "Programmes personnalisés basés sur votre état de santé et vos objectifs",
  "Suivi continu et évaluation régulière de vos progrès",
  "Environnement chaleureux et professionnel pour votre bien-être",
];

export default function AboutSection() {
  const imgRef = useScrollReveal({ threshold: 0.12 });
  const textRef = useScrollReveal({ threshold: 0.1 });

  return (
    <section
      className="section-about"
      id="apropos"
      aria-labelledby="about-title"
    >
      <div className="container">
        <div className="row align-items-center g-5">
          {/* Image */}
          <div className="col-lg-5">
            <div
              className="about-img-wrap reveal reveal--left"
              ref={imgRef}
            >
              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=500&fit=crop"
                alt="Salle de rééducation du centre physique"
                width="600"
                height="500"
                loading="lazy"
                className="about-img"
              />
              <div className="about-exp-badge" aria-label="10 ans d'expérience">
                <span className="exp-num">10+</span>
                <span className="exp-label">Ans d'expérience</span>
              </div>
            </div>
          </div>

          {/* Texte */}
          <div className="col-lg-7 reveal reveal--right" ref={textRef}>
            <p className="section-tag">À propos de nous</p>
            <h2 className="section-title" id="about-title">
              Un centre dédié à votre
              <br />
              <span className="text-blue">récupération optimale</span>
            </h2>
            <p className="about-desc">
              Notre centre de rééducation physique est un établissement moderne,
              équipé des dernières technologies médicales. Notre équipe de
              kinésithérapeutes et spécialistes qualifiés met tout en œuvre pour
              assurer votre rétablissement dans les meilleures conditions.
            </p>

            <ul className="about-list" aria-label="Nos atouts">
              {features.map((feat, i) => (
                <li key={i}>
                  <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <div className="about-actions">
              <a href="#rendez-vous" className="btn-primary">
                <i
                  className="bi bi-calendar2-check-fill"
                  aria-hidden="true"
                ></i>
                Prendre rendez-vous
              </a>
              <a href="#equipe" className="btn-outline">
                <i className="bi bi-people-fill" aria-hidden="true"></i>
                Notre équipe
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
