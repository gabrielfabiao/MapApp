import { getCareSchedule } from '../data/plantCareSchedule';

/**
 * Expands a recurring { startMonth, endMonth } window into a set of months
 * (0-11) for a given year, handling windows that wrap across year end
 * (e.g. startMonth: 11, endMonth: 1 => Dec, Jan, Feb).
 */
function monthsInWindow({ startMonth, endMonth }) {
  const months = [];
  let m = startMonth;
  while (true) {
    months.push(m);
    if (m === endMonth) break;
    m = (m + 1) % 12;
  }
  return months;
}

/**
 * Scans every project's markers for identified plants and builds a map of
 * "YYYY-MM" -> array of { type: 'prune'|'fertilize', plantName, projectName, projectId }
 * for the given year. Markers of the same species within the same project
 * are collapsed into a single entry per care type.
 */
export function buildCareEventsForYear(projects, year) {
  const eventsByMonthKey = new Map();

  const addEvent = (month, event) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (!eventsByMonthKey.has(key)) eventsByMonthKey.set(key, []);
    eventsByMonthKey.get(key).push(event);
  };

  for (const project of projects) {
    const seenSpecies = new Map();
    for (const marker of project.markers || []) {
      if (!marker.scientificName) continue;
      if (!seenSpecies.has(marker.scientificName)) {
        seenSpecies.set(marker.scientificName, marker.title || marker.scientificName);
      }
    }

    for (const [scientificName, plantName] of seenSpecies) {
      const schedule = getCareSchedule(scientificName);

      for (const month of monthsInWindow(schedule.prune)) {
        addEvent(month, { type: 'prune', plantName, scientificName, projectName: project.name, projectId: project.id });
      }
      for (const month of monthsInWindow(schedule.fertilize)) {
        addEvent(month, { type: 'fertilize', plantName, scientificName, projectName: project.name, projectId: project.id });
      }
    }
  }

  return eventsByMonthKey;
}
