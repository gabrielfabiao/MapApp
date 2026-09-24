const PETAL_COUNT = 7;
const PETAL_ANGLES = Array.from({ length: PETAL_COUNT }, (_, i) => (360 / PETAL_COUNT) * i);

export default function Logo({ size = 32, showWordmark = true, className = '' }) {
  return (
    <div className={`app-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {/* The rotation lives on the wrapping <g> so a CSS transform on the
            ellipse (used by the intro splash) doesn't override it. */}
        {PETAL_ANGLES.map(angle => (
          <g key={angle} transform={`rotate(${angle} 12 12)`}>
            <ellipse cx="12" cy="6.6" rx="2.2" ry="4.8" fill="var(--amazon-primary)" />
          </g>
        ))}
        <circle cx="12" cy="12" r="2.4" fill="var(--amazon-light)" />
      </svg>
      {showWordmark && <span className="app-logo-wordmark">BlooMap</span>}
    </div>
  );
}
