/**
 * Recurring yearly care windows (prune / fertilize) keyed by plant genus.
 * Months are 0-indexed (0 = January ... 11 = December) and windows are
 * inclusive. Matching is done against the genus (first word) of a marker's
 * scientificName, case-insensitively.
 *
 * Windows are generic Northern Hemisphere guidance meant as a starting
 * point, not precise agronomic advice.
 */
export const PLANT_CARE_SCHEDULE = {
  citrus: { prune: { startMonth: 1, endMonth: 2 }, fertilize: { startMonth: 1, endMonth: 4 } },
  eriobotrya: { prune: { startMonth: 5, endMonth: 6 }, fertilize: { startMonth: 1, endMonth: 2 } }, // loquat
  wisteria: { prune: { startMonth: 0, endMonth: 1 }, fertilize: { startMonth: 2, endMonth: 2 } },
  quercus: { prune: { startMonth: 11, endMonth: 1 }, fertilize: { startMonth: 2, endMonth: 3 } }, // oak

  prunus: { prune: { startMonth: 6, endMonth: 7 }, fertilize: { startMonth: 1, endMonth: 2 } }, // stone fruit genus fallback (apricot, peach, plum, cherry)

  rosa: { prune: { startMonth: 1, endMonth: 2 }, fertilize: { startMonth: 2, endMonth: 8 } },

  malus: { prune: { startMonth: 0, endMonth: 1 }, fertilize: { startMonth: 1, endMonth: 2 } }, // apple
  pyrus: { prune: { startMonth: 0, endMonth: 1 }, fertilize: { startMonth: 1, endMonth: 2 } }, // pear
  ficus: { prune: { startMonth: 0, endMonth: 1 }, fertilize: { startMonth: 3, endMonth: 8 } }, // fig
  olea: { prune: { startMonth: 2, endMonth: 3 }, fertilize: { startMonth: 2, endMonth: 3 } }, // olive
  diospyros: { prune: { startMonth: 0, endMonth: 1 }, fertilize: { startMonth: 1, endMonth: 2 } }, // persimmon
  vitis: { prune: { startMonth: 0, endMonth: 1 }, fertilize: { startMonth: 2, endMonth: 3 } }, // grape
  punica: { prune: { startMonth: 1, endMonth: 1 }, fertilize: { startMonth: 1, endMonth: 2 } }, // pomegranate
  persea: { prune: { startMonth: 2, endMonth: 3 }, fertilize: { startMonth: 2, endMonth: 8 } }, // avocado

  hydrangea: { prune: { startMonth: 1, endMonth: 2 }, fertilize: { startMonth: 2, endMonth: 4 } },
  buxus: { prune: { startMonth: 4, endMonth: 5 }, fertilize: { startMonth: 2, endMonth: 3 } }, // boxwood
  camellia: { prune: { startMonth: 3, endMonth: 4 }, fertilize: { startMonth: 3, endMonth: 4 } },
  lavandula: { prune: { startMonth: 7, endMonth: 8 }, fertilize: { startMonth: 2, endMonth: 2 } }, // lavender
  hibiscus: { prune: { startMonth: 1, endMonth: 2 }, fertilize: { startMonth: 3, endMonth: 8 } },
  bougainvillea: { prune: { startMonth: 1, endMonth: 2 }, fertilize: { startMonth: 3, endMonth: 8 } },
  rhododendron: { prune: { startMonth: 4, endMonth: 4 }, fertilize: { startMonth: 3, endMonth: 3 } }, // azalea
  gardenia: { prune: { startMonth: 1, endMonth: 2 }, fertilize: { startMonth: 3, endMonth: 8 } },
  lagerstroemia: { prune: { startMonth: 0, endMonth: 1 }, fertilize: { startMonth: 3, endMonth: 4 } }, // crape myrtle
  forsythia: { prune: { startMonth: 3, endMonth: 3 }, fertilize: { startMonth: 3, endMonth: 3 } },
  spiraea: { prune: { startMonth: 1, endMonth: 2 }, fertilize: { startMonth: 2, endMonth: 2 } },
  viburnum: { prune: { startMonth: 5, endMonth: 6 }, fertilize: { startMonth: 2, endMonth: 3 } },
  jasminum: { prune: { startMonth: 4, endMonth: 5 }, fertilize: { startMonth: 2, endMonth: 3 } }, // jasmine
  nerium: { prune: { startMonth: 2, endMonth: 3 }, fertilize: { startMonth: 3, endMonth: 8 } }, // oleander

  lavendula: { prune: { startMonth: 7, endMonth: 8 }, fertilize: { startMonth: 2, endMonth: 2 } },
  salvia: { prune: { startMonth: 1, endMonth: 2 }, fertilize: { startMonth: 2, endMonth: 2 } },
  lantana: { prune: { startMonth: 1, endMonth: 2 }, fertilize: { startMonth: 3, endMonth: 3 } },

  solanum: { prune: { startMonth: 5, endMonth: 6 }, fertilize: { startMonth: 3, endMonth: 5 } }, // tomato genus fallback
  lycopersicon: { prune: { startMonth: 5, endMonth: 6 }, fertilize: { startMonth: 3, endMonth: 5 } },

  lavanda: { prune: { startMonth: 7, endMonth: 8 }, fertilize: { startMonth: 2, endMonth: 2 } },
};

const DEFAULT_SCHEDULE = {
  prune: { startMonth: 1, endMonth: 2 },
  fertilize: { startMonth: 2, endMonth: 3 },
};

function extractGenus(scientificName) {
  if (!scientificName) return null;
  return scientificName.trim().split(/\s+/)[0].toLowerCase();
}

/**
 * Returns { prune, fertilize } care windows for a scientific name, falling
 * back to generic seasonal defaults when the genus isn't in the table.
 */
export function getCareSchedule(scientificName) {
  const genus = extractGenus(scientificName);
  if (genus && PLANT_CARE_SCHEDULE[genus]) return PLANT_CARE_SCHEDULE[genus];
  return DEFAULT_SCHEDULE;
}
