import SunCalc from 'suncalc';

export const DEFAULT_LOCATION = { lat: 51.5, lng: -0.1 };

// Intensity is an irradiance proxy: proportional to the sine of the solar
// elevation, which is what the shadow/wash rendering is driven by.
export function getSunPosition(location, date) {
  const { lat, lng } = location || DEFAULT_LOCATION;
  const pos = SunCalc.getPosition(date, lat, lng);
  return {
    altDeg: pos.altitude * 180 / Math.PI,
    aziDeg: (pos.azimuth * 180 / Math.PI + 180) % 360,
    intensity: Math.max(0, Math.sin(pos.altitude)) * 100,
  };
}
