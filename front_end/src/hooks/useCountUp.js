import { useEffect, useState } from "react";

export function useCountUp(target, { duration = 700, enabled = true } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const num = Number(target) || 0;
    if (!enabled) {
      setValue(num);
      return undefined;
    }

    let frame;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * num));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    setValue(0);
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, duration, enabled]);

  return value;
}
