export function Skeleton({ className = "", width, height, circle = false }) {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <span
      className={`ui-skeleton${circle ? " ui-skeleton--circle" : ""} ${className}`.trim()}
      style={Object.keys(style).length ? style : undefined}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="ui-skeleton-card" aria-hidden="true">
      <Skeleton circle width="44px" height="44px" />
      <div className="ui-skeleton-card__lines">
        <Skeleton height="14px" />
        <Skeleton height="10px" width="60%" />
      </div>
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="dash-stats dash-stats--4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ui-skeleton-stat">
          <Skeleton circle width="44px" height="44px" />
          <div className="ui-skeleton-stat__lines">
            <Skeleton height="20px" width="48px" />
            <Skeleton height="10px" width="72px" />
          </div>
        </div>
      ))}
    </div>
  );
}
