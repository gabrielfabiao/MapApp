'use client';

import { useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { getSunPosition } from '../../utils/sunPosition';
import { updateSunOverlayStyles } from '../../utils/sunOverlayUtils';

export default function SunEnvironment() {
  const { state } = useAppState();
  const project = state.currentProject;

  useEffect(() => {
    if (!project) return;
    const { altDeg, aziDeg, intensity } = getSunPosition(project.location, state.sunDate || new Date());
    updateSunOverlayStyles({
      altDeg,
      aziDeg,
      intensity,
      bearing: project.northBearing || 0,
      project,
      showShadows: state.showShadows,
    });
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
