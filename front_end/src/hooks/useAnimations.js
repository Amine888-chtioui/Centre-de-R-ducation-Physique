import { useEffect, useRef } from "react";

function isInViewport(el, threshold = 0.12) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const visibleHeight = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
  return visibleHeight > 0 && visibleHeight / rect.height >= threshold;
}

/**
 * useScrollReveal – fade/slide in when the element enters the viewport (or on load if already visible).
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { threshold = 0.12, rootMargin = "0px 0px -40px 0px" } =
      optionsRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        el.classList.toggle("visible", entry.isIntersecting);
      },
      { threshold, rootMargin },
    );

    observer.observe(el);

    const checkInitial = () => {
      if (isInViewport(el, threshold)) el.classList.add("visible");
    };

    requestAnimationFrame(() => requestAnimationFrame(checkInitial));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * useStaggerReveal – staggered reveal for child items inside a container.
 */
export function useStaggerReveal(
  count,
  {
    selector = ".reveal-stagger-item",
    delay = 110,
    threshold = 0.08,
    rootMargin = "0px 0px -40px 0px",
  } = {},
) {
  const containerRef = useRef(null);
  const optionsRef = useRef({ selector, delay, threshold, rootMargin });
  optionsRef.current = { selector, delay, threshold, rootMargin };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const {
      selector: itemSelector = ".reveal-stagger-item",
      delay: staggerDelay = 110,
      threshold: revealThreshold = 0.08,
      rootMargin: revealRootMargin = "0px 0px -40px 0px",
    } = optionsRef.current;

    const items = container.querySelectorAll(itemSelector);
    if (!items.length) return;

    let timers = [];

    const clearTimers = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };

    const showStagger = () => {
      clearTimers();
      items.forEach((item, i) => {
        const timer = setTimeout(
          () => item.classList.add("visible"),
          i * staggerDelay,
        );
        timers.push(timer);
      });
    };

    const hideStagger = () => {
      clearTimers();
      items.forEach((item) => item.classList.remove("visible"));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) showStagger();
        else hideStagger();
      },
      { threshold: revealThreshold, rootMargin: revealRootMargin },
    );

    observer.observe(container);

    const checkInitial = () => {
      if (isInViewport(container, revealThreshold)) showStagger();
    };

    requestAnimationFrame(() => requestAnimationFrame(checkInitial));

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [count]);

  return containerRef;
}

/**
 * useCounter – animates a number from 0 to target when visible.
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

    const checkInitial = () => {
      if (isInViewport(el, 0.3)) {
        animate();
        observer.unobserve(el);
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(checkInitial));

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
