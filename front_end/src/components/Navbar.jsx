import { useEffect, useRef } from "react";

const navLinks = [
  { href: "#accueil", label: "Accueil" },
  { href: "#services", label: "Services" },
  { href: "#apropos", label: "À propos" },
  { href: "#equipe", label: "Équipe" },
  { href: "#localisation", label: "Localisation" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const activeRef = useRef("accueil");

  // Close mobile menu on link click
  const handleNavClick = (e) => {
    if (window.innerWidth >= 992) return;
    const navCollapse = document.getElementById("navMenu");
    if (navCollapse?.classList.contains("show")) {
      const bsCollapse =
        window.bootstrap?.Collapse?.getOrCreateInstance(navCollapse);
      bsCollapse?.hide();
    }
  };

  // Active link on scroll
  useEffect(() => {
    const sections = document.querySelectorAll("section[id], footer[id]");
    const links = document.querySelectorAll(".navbar-nav .nav-link");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((link) => {
              link.classList.remove("active");
              link.removeAttribute("aria-current");
              if (link.getAttribute("href") === "#" + entry.target.id) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
              }
            });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  return (
    <header role="banner">
      <nav
        className="navbar navbar-expand-lg"
        role="navigation"
        aria-label="Menu principal"
      >
        <div className="container">
          {/* Logo */}
          <a
            className="navbar-brand"
            href="/"
            title="Centre de Rééducation Physique – Accueil"
            aria-label="Retour à l'accueil"
          >
            <span className="brand-logo" aria-hidden="true">
              <i className="bi bi-heart-pulse-fill"></i>
            </span>
            <span className="brand-text">
              Centre de
              <br />
              <strong>Rééducation Physique</strong>
            </span>
          </a>

          {/* Mobile toggle */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navMenu"
            aria-controls="navMenu"
            aria-expanded="false"
            aria-label="Ouvrir le menu"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Menu links */}
          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav mx-auto" role="list">
              {navLinks.map(({ href, label }, i) => (
                <li className="nav-item" role="listitem" key={href}>
                  <a
                    className={`nav-link${i === 0 ? " active" : ""}`}
                    href={href}
                    aria-current={i === 0 ? "page" : undefined}
                    onClick={handleNavClick}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="navbar-actions">
              <a
                href="tel:+212600000000"
                className="navbar-phone"
                aria-label="Appeler le centre au +212 600 000 000"
              >
                <i className="bi bi-telephone-fill" aria-hidden="true"></i>
                <span>+212 600 000 000</span>
              </a>
              <a
                href="#rendez-vous"
                className="btn-rdv-nav"
                onClick={handleNavClick}
              >
                <i
                  className="bi bi-calendar2-check-fill"
                  aria-hidden="true"
                ></i>
                Prendre rendez-vous
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
