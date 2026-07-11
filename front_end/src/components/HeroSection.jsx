import { useHeroCounter } from "../hooks/useAnimations";
import heroKineImg from "../assets/hero-kine.jpg";

function HeroStat({ value, label, delay }) {
  const ref = useHeroCounter(delay);
  return (
    <div className="hero-stat" role="listitem">
      <span
        ref={ref}
        className="stat-number"
        data-target={value}
        aria-label={`${value} ${label}`}
      >
        {value}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function HeroSection({ onRdvClick }) {
  return (
    <section className="section-hero" id="accueil" aria-labelledby="hero-title">
      <div className="hero-bg-ring hero-bg-ring--1" aria-hidden="true"></div>
      <div className="hero-bg-ring hero-bg-ring--2" aria-hidden="true"></div>

      <div className="container">
        <div className="row align-items-center g-5">
          {/* LEFT – Texte (après l'image sur mobile) */}
          <div className="col-lg-6 order-2 order-lg-1">
            <p className="hero-badge">
              <i className="bi bi-patch-check-fill" aria-hidden="true"></i>
              Centre agréé &amp; certifié
            </p>

            <h1 className="hero-title" id="hero-title">
              Centre de
              <br />
              <span className="text-blue">Rééducation</span>
              <br />
              Physique
            </h1>

            <p className="hero-subtitle">
              <span>Rééducation</span>
              <span className="hero-subtitle-dot" aria-hidden="true">
                {" "}
                ·{" "}
              </span>
              <span>Kinésithérapie</span>
              <span className="hero-subtitle-dot" aria-hidden="true">
                {" "}
                ·{" "}
              </span>
              <span>Récupération fonctionnelle</span>
            </p>

            <p className="hero-desc">
              Nous accompagnons chaque patient dans sa récupération après
              blessures, opérations ou troubles physiques, avec un suivi
              personnalisé et des techniques médicales modernes.
            </p>

            <div
              className="hero-btns"
              role="group"
              aria-label="Actions principales"
            >
              <button
                type="button"
                className="btn-primary"
                onClick={onRdvClick}
              >
                <i
                  className="bi bi-calendar2-check-fill"
                  aria-hidden="true"
                ></i>
                Prendre rendez-vous
              </button>
              <a href="#services" className="btn-outline">
                <i className="bi bi-grid-fill" aria-hidden="true"></i>
                Voir les services
              </a>
            </div>

            {/* Mini statistiques */}
            <div
              className="hero-stats"
              role="list"
              aria-label="Nos chiffres clés"
            >
              <HeroStat value="+500" label="Patients traités" delay={600} />
              <div className="stat-sep" aria-hidden="true"></div>
              <HeroStat value="+10" label="Ans d'expérience" delay={750} />
              <div className="stat-sep" aria-hidden="true"></div>
              <HeroStat value="95%" label="Taux de satisfaction" delay={900} />
            </div>
          </div>

          {/* RIGHT – Image médecin (en premier sur mobile) */}
          <div className="col-lg-6 order-1 order-lg-2">
            <div className="hero-visual" aria-hidden="true">
              <div className="doctor-ring doctor-ring--dashed"></div>
              <div className="doctor-ring doctor-ring--solid"></div>

              <div className="doctor-circle">
                <img
                  src={heroKineImg}
                  alt="Kinésithérapeute réalisant une mobilisation du dos avec une patiente"
                  width="480"
                  height="480"
                  loading="eager"
                  fetchPriority="high"
                  className="doctor-img"
                />
              </div>

              {/* Floating cards */}
              <div className="float-card float-card--knee">
                <span className="fc-icon fc-icon--blue">
                  <i className="bi bi-bandaid-fill" aria-hidden="true"></i>
                </span>
                <div>
                  <p className="fc-label">Genou</p>
                  <p className="fc-sub">Post-opératoire</p>
                </div>
              </div>

              <div className="float-card float-card--spine">
                <span className="fc-icon fc-icon--orange">
                  <i className="bi bi-activity" aria-hidden="true"></i>
                </span>
                <div>
                  <p className="fc-label">Colonne</p>
                  <p className="fc-sub">Rééducation</p>
                </div>
              </div>

              <div className="float-card float-card--arm">
                <span className="fc-icon fc-icon--green">
                  <i className="bi bi-person-arms-up" aria-hidden="true"></i>
                </span>
                <div>
                  <p className="fc-label">Bras &amp; Épaule</p>
                  <p className="fc-sub">Kinésithérapie</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
