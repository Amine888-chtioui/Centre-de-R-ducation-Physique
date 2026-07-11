import { useCountUp } from "../../hooks/useCountUp";

export default function CountUp({ value, className, duration }) {
  const display = useCountUp(value, { duration, enabled: value != null });
  return <span className={className}>{display}</span>;
}
