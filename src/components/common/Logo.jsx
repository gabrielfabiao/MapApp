export default function Logo({ size = 32, showWordmark = true, className = '' }) {
  return (
    <div className={`app-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.4 11.44 7.06 12.06a1.34 1.34 0 0 0 1.88 0C13.6 21.44 20 15.25 20 10c0-4.42-3.58-8-8-8z"
          fill="var(--amazon-primary)"
        />
        <circle cx="12" cy="10" r="5" fill="#fdfcf8" />
        <path
          d="M12 6.2c-2.4 0-4.3 1.9-4.3 4.2 0 1.55.93 2.9 2.28 3.65L12 15.9l2.02-1.85C15.37 13.3 16.3 11.95 16.3 10.4c0-2.3-1.9-4.2-4.3-4.2z"
          fill="var(--amazon-dark)"
        />
        <path d="M12 8.3v6" stroke="var(--amazon-light)" strokeWidth="0.9" strokeLinecap="round" />
      </svg>
      {showWordmark && <span className="app-logo-wordmark">BlooMap</span>}
    </div>
  );
}
