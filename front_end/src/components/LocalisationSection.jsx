const infoItems = [
  {
    iconClass: "bi-hospital-fill",
    colorClass: "loc-item-icon--blue",
    label: "Centre médical",
    value: "Kinésithérapie & Rééducation physique",
  },
  {
    iconClass: "bi-geo-alt-fill",
    colorClass: "loc-item-icon--gray",
    label: "Adresse",
    value: "123 Avenue Mohammed V, Casablanca, Maroc",
  },
  {
    iconClass: "bi-clock-fill",
    colorClass: "loc-item-icon--blue",
    label: "Horaires",
    value: (
      <>
        Lun – Ven : 08h00 – 18h00
        <br />
        Samedi : 08h00 – 13h00
      </>
    ),
  },
  {
    iconClass: "bi-star-fill",
    colorClass: "loc-item-icon--yellow",
    label: "Note Google",
    value: "4.9 / 5 ⭐ — Établissement reconnu",
  },
];

export default function LocalisationSection() {
  return (
    <section
      className="section-localisation"
      id="localisation"
      aria-labelledby="loc-title"
    >
      <div className="container">
        <header className="section-header text-center">
          <p className="section-tag">Localisation</p>
          <h2 className="section-title" id="loc-title">
            Nous <span className="text-blue">trouver</span>
          </h2>
          <p className="section-subtitle mx-auto">
            123 Avenue Mohammed V — Casablanca, Maroc
          </p>
        </header>

        <div className="row g-4 align-items-stretch">
          {/* Google Maps */}
          <div className="col-lg-8">
            <div className="loc-map-wrap">
              <a
                href="https://maps.google.com/?q=123+Avenue+Mohammed+V+Casablanca+Maroc"
                target="_blank"
                rel="noopener noreferrer"
                className="loc-map-open"
                aria-label="Ouvrir dans Google Maps"
              >
                <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                Ouvrir dans Maps
              </a>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3323.847!2d-7.5898!3d33.5731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda7d282b6ebe8d5%3A0x7ac946f96af73c49!2sCasablanca%2C%20Morocco!5e0!3m2!1sfr!2sma!4v1700000000000!5m2!1sfr!2sma"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localisation du Centre de Rééducation Physique – Casablanca"
              ></iframe>
            </div>
          </div>

          {/* Info card */}
          <div className="col-lg-4">
            <div className="loc-info-card">
              <div className="loc-info-header">
                <span className="loc-info-icon" aria-hidden="true">
                  <i className="bi bi-geo-alt-fill"></i>
                </span>
                <h3 className="loc-info-name">
                  Centre de Rééducation
                  <br />
                  Physique – Casablanca
                </h3>
              </div>

              <ul className="loc-info-list" aria-label="Informations pratiques">
                {infoItems.map(({ iconClass, colorClass, label, value }) => (
                  <li className="loc-info-item" key={label}>
                    <span
                      className={`loc-item-icon ${colorClass}`}
                      aria-hidden="true"
                    >
                      <i className={`bi ${iconClass}`}></i>
                    </span>
                    <div>
                      <strong>{label}</strong>
                      <span>{value}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <a
                href="https://maps.google.com/?q=123+Avenue+Mohammed+V+Casablanca+Maroc"
                target="_blank"
                rel="noopener noreferrer"
                className="loc-btn-maps"
                aria-label="Ouvrir la localisation dans Google Maps"
              >
                <i className="bi bi-geo-fill" aria-hidden="true"></i>
                Ouvrir dans Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
