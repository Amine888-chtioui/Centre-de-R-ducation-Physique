export default function CTASection() {
  return (
    <section className="section-cta" id="rendez-vous" aria-labelledby="cta-title">
      <div className="cta-bg-circle" aria-hidden="true"></div>
      <div className="container text-center position-relative">
        <p className="hero-badge hero-badge--white">
          <i className="bi bi-calendar2-heart-fill" aria-hidden="true"></i>
          Disponible maintenant
        </p>
        <h2 className="cta-title" id="cta-title">
          Commencez votre rééducation<br />dès aujourd'hui
        </h2>
        <p className="cta-desc mx-auto">
          Prenez rendez-vous avec nos spécialistes et bénéficiez d'une première
          évaluation personnalisée.
        </p>
        <div className="cta-actions">
          <a href="#contact" className="btn-cta-white">
            <i className="bi bi-calendar2-check-fill" aria-hidden="true"></i>
            Réserver un rendez-vous
          </a>
          <a href="tel:+212600000000" className="cta-phone" aria-label="Appelez-nous au +212 600 000 000">
            <span className="cta-phone__icon" aria-hidden="true">
              <i className="bi bi-telephone-fill"></i>
            </span>
            <span>
              <span className="cta-phone__label">Appelez-nous directement</span>
              <span className="cta-phone__num">+212 600 000 000</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}