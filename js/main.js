/* ============================================================
   main.js – Centre de Rééducation Physique
   ============================================================ */

"use strict";

/* ────────────────────────────────────────
   Scroll animation – IntersectionObserver
   Ajoute la classe .visible aux cards
   quand elles entrent dans le viewport
──────────────────────────────────────── */
(function initScrollReveal() {
  const targets = document.querySelectorAll(
    ".service-card, .stat-box, .about-img-wrap",
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target); // animate once
        }
      });
    },
    { threshold: 0.12 },
  );

  targets.forEach((el) => observer.observe(el));
})();

/* ────────────────────────────────────────
   Navbar – active link on scroll
──────────────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll("section[id], footer[id]");
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
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
})();

/* ────────────────────────────────────────
   Smooth close mobile menu on link click
──────────────────────────────────────── */
(function initMobileMenuClose() {
  const navLinks = document.querySelectorAll(
    ".navbar-nav .nav-link, .btn-rdv-nav",
  );
  const navCollapse = document.getElementById("navMenu");

  if (!navCollapse) return;

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992 && navCollapse.classList.contains("show")) {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(navCollapse);
        bsCollapse.hide();
      }
    });
  });
})();
