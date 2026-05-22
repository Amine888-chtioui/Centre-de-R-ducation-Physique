import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./auth/AuthModal";

const navLinks = [
  { href: "#accueil", label: "Accueil" },
  { href: "#services", label: "Services" },
  { href: "#apropos", label: "À propos" },
  { href: "#localisation", label: "Localisation" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  // État de la modal : ouverte/fermée et quelle vue (login ou register)
  const [modalState, setModalState] = useState({
    isOpen: false,
    view: "login",
  });
  const { user, isAuthenticated, logout } = useAuth();

  const openLogin = () => setModalState({ isOpen: true, view: "login" });
  const openRegister = () => setModalState({ isOpen: true, view: "register" });
  const closeModal = () => setModalState((s) => ({ ...s, isOpen: false }));

  // Fermeture menu mobile sur clic lien
  const handleNavClick = () => {
    if (window.innerWidth >= 992) return;
    const navCollapse = document.getElementById("navMenu");
    if (navCollapse?.classList.contains("show")) {
      window.bootstrap?.Collapse?.getOrCreateInstance(navCollapse)?.hide();
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
    <>
      <header role="banner">
        <nav
          className="navbar navbar-expand-lg"
          role="navigation"
          aria-label="Menu principal"
        >
          <div className="container">
            <a
              className="navbar-brand"
              href="/"
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
                  aria-label="Appeler"
                >
                  <i className="bi bi-telephone-fill" aria-hidden="true"></i>
                  <span>+212 600 000 000</span>
                </a>

                <div
                  className="navbar-auth"
                  role="group"
                  aria-label="Authentification"
                >
                  {isAuthenticated ? (
                    /* ── Utilisateur connecté ── */
                    <div className="user-menu">
                      <span className="user-greeting">
                        <i
                          className="bi bi-person-check-fill"
                          aria-hidden="true"
                        ></i>
                        {user?.prenom}
                      </span>
                      <button
                        className="btn-login"
                        onClick={logout}
                        aria-label="Se déconnecter"
                      >
                        <i
                          className="bi bi-box-arrow-right"
                          aria-hidden="true"
                        ></i>
                        Déconnexion
                      </button>
                    </div>
                  ) : (
                    /* ── Non connecté ── */
                    <>
                      <button
                        className="btn-login"
                        onClick={openLogin}
                        aria-label="Se connecter"
                      >
                        <i className="bi bi-person-fill" aria-hidden="true"></i>
                        Se connecter
                      </button>
                      <button
                        className="btn-signup"
                        onClick={openRegister}
                        aria-label="S'inscrire"
                      >
                        <i
                          className="bi bi-person-plus-fill"
                          aria-hidden="true"
                        ></i>
                        S'inscrire
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Modal d'authentification */}
      <AuthModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        initialView={modalState.view}
      />
    </>
  );
}
