import { useEffect } from 'react';
import SunCalc from 'suncalc';
import { useAppState } from '../../context/AppContext';

export default function SunCompass() {
  const { state } = useAppState();
  const project = state.currentProject;

  useEffect(() => {
    if (!project) return;
    const loc = project.location || { lat: 51.5, lng: -0.1 };
    const date = state.sunDate || new Date();
    const pos = SunCalc.getPosition(date, loc.lat, loc.lng);
    const altDeg = pos.altitude * 180 / Math.PI;
    const aziDeg = (pos.azimuth * 180 / Math.PI + 180) % 360;
    const intensity = Math.max(0, Math.sin(pos.altitude)) * 100;
    const bearing = project.northBearing || 0;

    const compassRose = document.getElementById('compass-rose');
    const sunArrow = document.getElementById('sun-arrow');
    const sunBeam = document.getElementById('sun-beam');
    const sunDot = document.getElementById('sun-dot');

    if (compassRose) compassRose.style.transform = `rotate(${-bearing}deg)`;
    if (sunArrow) sunArrow.style.transform = `rotate(${aziDeg - bearing}deg)`;

    let color = '#fbbf24';
    let beamColor = 'rgba(255, 200, 0, 0.4)';
    if (altDeg < 0) { color = '#334155'; beamColor = 'rgba(0,0,0,0)'; }
    else if (altDeg < 15) { color = '#ef4444'; beamColor = 'rgba(239, 68, 68, 0.5)'; }
    else if (altDeg < 30) { color = '#f97316'; beamColor = 'rgba(249, 115, 22, 0.45)'; }

    if (sunDot) sunDot.setAttribute('fill', color);
    if (sunBeam) {
      sunBeam.setAttribute('fill', beamColor);
      sunBeam.style.opacity = intensity > 0 ? String(1 - Math.sin(altDeg * Math.PI / 180) * 0.5) : '0';
    }
  }, [project, state.sunDate]);

  return (
    <div
      id="sun-overlay-container"
      style={{ position: 'absolute', bottom: 20, left: 20, pointerEvents: 'none', zIndex: 101 }}
    >
      <div className="sun-compass fade-in" style={{ width: 120, height: 120, position: 'relative' }}>
        <svg viewBox="-50 -50 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <circle cx="0" cy="0" r="45" fill="rgba(10, 15, 28, 0.6)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <g id="compass-rose" style={{ transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <text x="0" y="-32" fill="rgba(255,255,255,0.6)" fontSize="10" fontWeight="800" textAnchor="middle" dominantBaseline="middle">N</text>
            <text x="0" y="32" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="600" textAnchor="middle" dominantBaseline="middle">S</text>
            <text x="32" y="0" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="600" textAnchor="middle" dominantBaseline="middle">E</text>
            <text x="-32" y="0" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="600" textAnchor="middle" dominantBaseline="middle">W</text>
            <line x1="0" y1="-25" x2="0" y2="-40" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          </g>
          <g id="sun-arrow" style={{ transition: 'transform 0.3s ease-out' }}>
            <path d="M 0 0 L -12 -45 A 45 45 0 0 1 12 -45 Z" id="sun-beam" fill="rgba(255, 200, 0, 0.4)" />
            <circle cx="0" cy="-45" r="5" id="sun-dot" fill="#fbbf24" stroke="#fff" strokeWidth="1" />
          </g>
          <circle cx="0" cy="0" r="2" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}
