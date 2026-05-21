const navLinks = [
  { href: "#accueil", label: "Accueil" },
  { href: "#services", label: "Services" },
  { href: "#apropos", label: "À propos" },
  { href: "#equipe", label: "Équipe" },
  { href: "#contact", label: "Contact" },
];

const serviceLinks = [
  { href: "#services", label: "Post-opératoire" },
  { href: "#services", label: "Kinésithérapie" },
  { href: "#services", label: "Neurologique" },
  { href: "#services", label: "Massage" },
  { href: "#services", label: "Suivi perso." },
];

const socials = [
  { href: "https://facebook.com", icon: "bi-facebook", label: "Facebook" },
  { href: "https://instagram.com", icon: "bi-instagram", label: "Instagram" },
  { href: "https://linkedin.com", icon: "bi-linkedin", label: "LinkedIn" },
  { href: "https://twitter.com", icon: "bi-twitter-x", label: "Twitter / X" },
];

export default function Footer() {
  return (
    <footer className="site-footer" id="contact" role="contentinfo">
      <div className="container">
        <div className="row g-5">
          {/* Brand + réseaux sociaux */}
          <div className="col-lg-4">
            <div className="footer-brand">
              <span className="brand-logo" aria-hidden="true">
                <i className="bi bi-heart-pulse-fill"></i>
              </span>
              <strong>Centre de Rééducation Physique</strong>
            </div>
            <p className="footer-desc">
              Votre partenaire de confiance pour une récupération complète et
              durable.
            </p>
            <nav aria-label="Réseaux sociaux">
              <ul className="social-list" role="list">
                {socials.map(({ href, icon, label }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                    >
                      <i className={`bi ${icon}`} aria-hidden="true"></i>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Navigation */}
          <div className="col-6 col-lg-2">
            <h3 className="footer-heading">Navigation</h3>
            <nav aria-label="Footer navigation">
              <ul className="footer-list" role="list">
                {navLinks.map(({ href, label }) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Services */}
          <div className="col-6 col-lg-2">
            <h3 className="footer-heading">Services</h3>
            <nav aria-label="Services du centre">
              <ul className="footer-list" role="list">
                {serviceLinks.map(({ href, label }) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Contact + horaires */}
          <div className="col-lg-4">
            <h3 className="footer-heading">Contact</h3>
            <address className="footer-address">
              <p className="footer-contact-item">
                <i className="bi bi-geo-alt-fill" aria-hidden="true"></i>
                <span>123 Avenue Mohammed V, Casablanca, Maroc</span>
              </p>
              <p className="footer-contact-item">
                <i className="bi bi-telephone-fill" aria-hidden="true"></i>
                <a href="tel:+212600000000">+212 600 000 000</a>
              </p>
              <p className="footer-contact-item">
                <i className="bi bi-envelope-fill" aria-hidden="true"></i>
                <a href="mailto:contact@centre-reeducation.ma">
                  contact@centre-reeducation.ma
                </a>
              </p>
            </address>

            <div className="footer-schedule">
              <p className="schedule-badge">
                <i className="bi bi-clock-fill" aria-hidden="true"></i> Horaires
              </p>
              <p className="footer-contact-item">
                <i className="bi bi-calendar3" aria-hidden="true"></i>
                <span>
                  Lun – Ven : 08h00 – 18h00
                  <br />
                  Samedi : 08h00 – 13h00
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>
            © <time dateTime="2025">2025</time> Centre de Rééducation Physique.
            Tous droits réservés.
          </p>
          <p>
            Conçu avec{" "}
            <i
              className="bi bi-heart-fill"
              style={{ color: "var(--blue-primary)" }}
              aria-hidden="true"
            ></i>{" "}
            pour votre santé
          </p>
        </div>
      </div>
    </footer>
  );
}
