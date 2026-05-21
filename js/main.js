/* ============================================================
   main.js – Centre de Rééducation Physique
   ============================================================ */

"use strict";

/* ────────────────────────────────────────
   1. Scroll reveal – service cards & about image
   Apparition avec délai progressif (stagger)
──────────────────────────────────────── */
(function initScrollReveal() {
  const targets = document.querySelectorAll(".about-img-wrap");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  targets.forEach((el) => observer.observe(el));
})();

/* ────────────────────────────────────────
   2. Service cards – apparition décalée (stagger)
   Chaque carte entre avec un délai progressif
──────────────────────────────────────── */
(function initServiceStagger() {
  const cards = document.querySelectorAll(".service-card");
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.idx || "0");
          setTimeout(() => {
            entry.target.classList.add("visible");
          }, idx * 110);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );

  cards.forEach((el, i) => {
    el.dataset.idx = i;
    observer.observe(el);
  });
})();

/* ────────────────────────────────────────
   3. Counter animation – section statistiques
   Les chiffres s'incrémentent de 0 à leur
   valeur cible dès qu'ils entrent dans le viewport.
   Supporte les préfixes (+) et suffixes (%, /7)
──────────────────────────────────────── */
(function initCounters() {
  const boxes = document.querySelectorAll(".stat-box__num");
  if (!boxes.length) return;

  function parseTarget(el) {
    const raw = el.textContent.trim();
    // Extraire le nombre, le préfixe et le suffixe
    const num = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
    const pre = raw.match(/^[^0-9]*/)?.[0] || "";
    const suf = raw.match(/[^0-9.]+$/)?.[0] || "";
    return { num, pre, suf };
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el, num, pre, suf, duration = 1800) {
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(easeOutCubic(progress) * num);
      el.textContent = pre + value + suf;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = pre + num + suf; // valeur finale exacte
    }
    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const { num, pre, suf } = parseTarget(entry.target);
          // Reset à 0 puis animation
          entry.target.textContent = pre + "0" + suf;
          animateCounter(entry.target, num, pre, suf);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  boxes.forEach((el) => observer.observe(el));
})();

/* ────────────────────────────────────────
   4. Hero stats counter – même animation
   pour les mini-stats dans le hero
──────────────────────────────────────── */
(function initHeroCounters() {
  const nums = document.querySelectorAll(".stat-number");
  if (!nums.length) return;

  function parseTarget(el) {
    const raw = el.textContent.trim();
    const num = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
    const pre = raw.match(/^[^0-9]*/)?.[0] || "";
    const suf = raw.match(/[^0-9.]+$/)?.[0] || "";
    return { num, pre, suf };
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el, num, pre, suf, duration = 1400) {
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(easeOutCubic(progress) * num);
      el.textContent = pre + value + suf;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = pre + num + suf;
    }
    requestAnimationFrame(tick);
  }

  // Les hero stats sont visibles dès le chargement
  // On les anime après un court délai
  window.addEventListener("load", () => {
    nums.forEach((el, i) => {
      const { num, pre, suf } = parseTarget(el);
      el.textContent = pre + "0" + suf;
      setTimeout(() => animateCounter(el, num, pre, suf), 600 + i * 150);
    });
  });
})();

/* ────────────────────────────────────────
   5. Navbar – active link on scroll
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
   6. Mobile menu – fermeture au clic
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
