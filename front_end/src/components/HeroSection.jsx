import { useHeroCounter } from "../hooks/useAnimations";

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

export default function HeroSection() {
  return (
    <section className="section-hero" id="accueil" aria-labelledby="hero-title">
      <div className="hero-bg-ring hero-bg-ring--1" aria-hidden="true"></div>
      <div className="hero-bg-ring hero-bg-ring--2" aria-hidden="true"></div>

      <div className="container">
        <div className="row align-items-center g-5">
          {/* LEFT – Texte */}
          <div className="col-lg-6">
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
              Rééducation · Kinésithérapie · Récupération fonctionnelle
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
              <a href="#rendez-vous" className="btn-primary">
                <i
                  className="bi bi-calendar2-check-fill"
                  aria-hidden="true"
                ></i>
                Prendre rendez-vous
              </a>
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

            {/* Slide counter */}
            <div className="hero-counter" aria-label="Diapositive 1 sur 5">
              <span className="counter-num">01</span>
              <span className="counter-total">/ 05</span>
              <div className="counter-dots" aria-hidden="true">
                <span className="dot dot--active"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>

          {/* RIGHT – Image médecin */}
          <div className="col-lg-6">
            <div className="hero-visual" aria-hidden="true">
              <div className="doctor-ring doctor-ring--dashed"></div>
              <div className="doctor-ring doctor-ring--solid"></div>

              <div className="doctor-circle">
                <img
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&h=600&fit=crop&crop=top"
                  alt="Kinésithérapeute du centre de rééducation"
                  width="480"
                  height="480"
                  loading="eager"
                  fetchPriority="high"
                  className="doctor-img"
                />
              </div>

              {/* Floating cards */}
              <div className="float-card float-card--knee">
                <span className="fc-icon fc-icon--blue">🦵</span>
                <div>
                  <p className="fc-label">Genou</p>
                  <p className="fc-sub">Post-opératoire</p>
                </div>
              </div>

              <div className="float-card float-card--spine">
                <span className="fc-icon fc-icon--orange">🦴</span>
                <div>
                  <p className="fc-label">Colonne</p>
                  <p className="fc-sub">Rééducation</p>
                </div>
              </div>

              <div className="float-card float-card--arm">
                <span className="fc-icon fc-icon--green">💪</span>
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
