import { useEffect } from 'react';
import SunCalc from 'suncalc';
import { useAppState } from '../../context/AppContext';
import { updateSunOverlayStyles } from '../../utils/sunOverlayUtils';

export default function SunEnvironment() {
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
    updateSunOverlayStyles(altDeg, aziDeg, intensity, bearing, project, state);
  }, [project, state.sunDate, state.showShadows]);

  return (
    <svg
      id="shadow-environment"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <rect width="100%" height="100%" fill="transparent" id="sun-wash-rect" />
      <g id="shadow-polygons" />
      <g id="tree-shadow-polygons" />
    </svg>
  );
}
