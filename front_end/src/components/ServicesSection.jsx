import { useScrollReveal, useStaggerReveal } from "../hooks/useAnimations";

const services = [
  {
    icon: "bi-bandaid-fill",
    title: "Rééducation post-opératoire",
    desc: "Accompagnement spécialisé après une opération chirurgicale pour retrouver toutes vos capacités motrices.",
    ariaLabel: "Service rééducation post-opératoire",
  },
  {
    icon: "bi-trophy-fill",
    title: "Kinésithérapie sportive",
    desc: "Traitement des blessures sportives et optimisation des performances physiques des athlètes de tous niveaux.",
    ariaLabel: "Service kinésithérapie sportive",
  },
  {
    icon: "bi-activity",
    title: "Rééducation des blessures",
    desc: "Protocoles adaptés pour traiter efficacement les traumatismes musculaires, osseux et articulaires.",
    ariaLabel: "Service rééducation des blessures",
  },
  {
    icon: "bi-brain",
    title: "Réadaptation neurologique",
    desc: "Prise en charge des troubles neurologiques : AVC, maladies dégénératives et lésions de la moelle épinière.",
    ariaLabel: "Service réadaptation neurologique",
  },
  {
    icon: "bi-hand-index-thumb-fill",
    title: "Massage thérapeutique",
    desc: "Techniques de massage adaptées pour soulager la douleur, améliorer la circulation et favoriser la guérison.",
    ariaLabel: "Service massage thérapeutique",
  },
  {
    icon: "bi-person-check-fill",
    title: "Suivi personnalisé",
    desc: "Programme individuel avec évaluation régulière des progrès et ajustement du traitement selon votre évolution.",
    ariaLabel: "Service suivi personnalisé",
  },
];

export default function ServicesSection() {
  const containerRef = useStaggerReveal(services.length, {
    selector: ".service-card",
  });
  const headerRef = useScrollReveal();

  return (
    <section
      className="section-services"
      id="services"
      aria-labelledby="services-title"
    >
      <div className="container">
        <header
          className="section-header text-center reveal reveal--up"
          ref={headerRef}
        >
          <p className="section-tag">Nos Services</p>
          <h2 className="section-title" id="services-title">
            Des soins adaptés à <span className="text-blue">chaque besoin</span>
          </h2>
          <p className="section-subtitle mx-auto">
            Notre équipe pluridisciplinaire vous propose une prise en charge
            globale et personnalisée selon votre situation.
          </p>
        </header>

        <div className="row g-4" ref={containerRef}>
          {services.map(({ icon, title, desc, ariaLabel }) => (
            <div className="col-sm-6 col-lg-4" key={title}>
              <article className="service-card" aria-label={ariaLabel}>
                <div className="service-icon" aria-hidden="true">
                  <i className={`bi ${icon}`}></i>
                </div>
                <h3 className="service-title">{title}</h3>
                <p className="service-desc">{desc}</p>
                <a
                  href="#contact"
                  className="service-link"
                  aria-label={`En savoir plus sur ${title.toLowerCase()}`}
                >
                  En savoir plus
                  <i className="bi bi-arrow-right" aria-hidden="true"></i>
                </a>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
