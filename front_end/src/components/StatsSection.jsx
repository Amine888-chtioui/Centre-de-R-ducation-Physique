import { useCounter, useStaggerReveal } from "../hooks/useAnimations";

const stats = [
  {
    icon: "bi-people-fill",
    value: "+500",
    label: "Patients traités",
    aria: "Plus de 500 patients traités",
  },
  {
    icon: "bi-award-fill",
    value: "+10",
    label: "Ans d'expérience",
    aria: "Plus de 10 ans d'expérience",
  },
  {
    icon: "bi-star-fill",
    value: "95%",
    label: "Taux de satisfaction",
    aria: "95% de taux de satisfaction",
  },
  {
    icon: "bi-shield-check",
    value: "24/7",
    label: "Support professionnel",
    aria: "Support professionnel 24h/7j",
  },
];

function StatBox({ icon, value, label, aria }) {
  const ref = useCounter();
  return (
    <div className="stat-box reveal-stagger-item">
      <i className={`bi ${icon} stat-box__icon`} aria-hidden="true"></i>
      <p
        ref={ref}
        className="stat-box__num"
        data-target={value}
        aria-label={aria}
      >
        {value}
      </p>
      <p className="stat-box__label">{label}</p>
    </div>
  );
}

export default function StatsSection() {
  const rowRef = useStaggerReveal(stats.length, { delay: 120 });

  return (
    <section className="section-stats" aria-labelledby="stats-title">
      <div className="container">
        <h2 className="visually-hidden" id="stats-title">
          Nos chiffres clés
        </h2>
        <div className="row g-4 text-center" ref={rowRef}>
          {stats.map((stat) => (
            <div className="col-6 col-lg-3" key={stat.label}>
              <StatBox {...stat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
