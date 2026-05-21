import { useEffect, useRef } from "react";

/**
 * useScrollReveal – adds the "visible" class when the element enters the viewport.
 * @param {object} options – IntersectionObserver options
 * @returns ref to attach to the target element
 */
export function useScrollReveal(options = { threshold: 0.12 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add("visible");
        observer.unobserve(el);
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * useStaggerReveal – staggered reveal for a list of cards.
 * @param {number} count – number of items
 * @param {number} delay – ms between each item
 * @returns ref to attach to the container
 */
export function useStaggerReveal(count, delay = 110) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll(".service-card");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          cards.forEach((card, i) => {
            setTimeout(() => card.classList.add("visible"), i * delay);
          });
          observer.unobserve(container);
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [count, delay]);

  return containerRef;
}

/**
 * useCounter – animates a number from 0 to target when visible.
 * Supports prefix (+) and suffix (%, /7).
 */
export function useCounter() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const raw = el.dataset.target || el.textContent.trim();
    const num = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
    const pre = raw.match(/^[^0-9]*/)?.[0] || "";
    const suf = raw.match(/[^0-9.]+$/)?.[0] || "";

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(duration = 1800) {
      const start = performance.now();
      el.textContent = pre + "0" + suf;
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = pre + Math.round(easeOutCubic(progress) * num) + suf;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = pre + num + suf;
      }
      requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * useHeroCounter – animates hero stat numbers after page load.
 */
export function useHeroCounter(delayMs = 600) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const raw = el.dataset.target || el.textContent.trim();
    const num = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
    const pre = raw.match(/^[^0-9]*/)?.[0] || "";
    const suf = raw.match(/[^0-9.]+$/)?.[0] || "";

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(duration = 1400) {
      const start = performance.now();
      el.textContent = pre + "0" + suf;
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = pre + Math.round(easeOutCubic(progress) * num) + suf;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = pre + num + suf;
      }
      requestAnimationFrame(tick);
    }

    const timer = setTimeout(animate, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return ref;
}
