import { useScrollReveal } from "../hooks/useAnimations";
import { usePublicSettings } from "../hooks/usePublicSettings";

export default function CTASection({ onRdvClick }) {
  const contentRef = useScrollReveal({ threshold: 0.15 });
  const { phone, telHref } = usePublicSettings();

  return (
    <section
      className="section-cta"
      id="rendez-vous"
      aria-labelledby="cta-title"
    >
      <div className="cta-bg-circle" aria-hidden="true"></div>
      <div
        className="container text-center position-relative reveal reveal--up"
        ref={contentRef}
      >
        <p className="hero-badge hero-badge--white">
          <i className="bi bi-calendar2-heart-fill" aria-hidden="true"></i>
          Disponible maintenant
        </p>
        <h2 className="cta-title" id="cta-title">
          Commencez votre rééducation
          <br className="cta-title-break" /> dès aujourd&apos;hui
        </h2>
        <p className="cta-desc mx-auto">
          Prenez rendez-vous avec nos spécialistes et bénéficiez d&apos;une
          première évaluation personnalisée.
        </p>
        <div className="cta-actions">
          <button type="button" className="btn-cta-white" onClick={onRdvClick}>
            <i className="bi bi-calendar2-check-fill" aria-hidden="true"></i>
            Réserver un rendez-vous
          </button>
          <a
            href={telHref}
            className="cta-phone"
            aria-label={`Appelez-nous au ${phone}`}
          >
            <span className="cta-phone__icon" aria-hidden="true">
              <i className="bi bi-telephone-fill"></i>
            </span>
            <span>
              <span className="cta-phone__label">Appelez-nous directement</span>
              <span className="cta-phone__num">{phone}</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
