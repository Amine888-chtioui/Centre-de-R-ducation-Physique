const LOCATION_QUERY = "Bouznika,+Maroc";
const LOCATION_LABEL = "Bouznika, Maroc";
const MAP_CENTER = "33.7894,-7.1597";

const MAPS_LINK = `https://maps.google.com/?q=${LOCATION_QUERY}`;

/* Vue satellite centrée sur Bouznika */
const MAP_EMBED_SRC = `https://maps.google.com/maps?q=${MAP_CENTER}&hl=fr&z=14&ie=UTF8&iwloc=near&output=embed&t=k`;

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
    value: LOCATION_LABEL,
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
            {LOCATION_LABEL}
          </p>
        </header>

        <div className="row g-4 align-items-stretch">
          {/* Google Maps */}
          <div className="col-lg-8">
            <div className="loc-map-wrap">
              <div className="loc-map-frame">
                <iframe
                  src={MAP_EMBED_SRC}
                  className="loc-map-iframe"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation du Centre de Rééducation Physique – Bouznika"
                ></iframe>
              </div>
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="loc-map-open"
                aria-label="Ouvrir dans Google Maps"
              >
                <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                Ouvrir dans Maps
              </a>
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
                  Physique – Bouznika
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
                href={MAPS_LINK}
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
