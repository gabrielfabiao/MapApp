# BlooMap — Roadmap / Future Features

Ideas and features to add to the app, roughly grouped by area. Not ordered by priority unless stated.

---

## 1. "Where should I put this plant?" (sun-based placement recommendation)

Recommend a whole area of the garden where a given plant should be placed.

- Inputs:
  - The buildings/structures the user has drawn with the **shadow** feature (position, height, footprint)
  - The daily sun hours the plant needs (full sun / partial shade / shade, or an explicit hours value)
  - Location + date range (to compute sun path / shadow projection over the season, not just one instant)
- Logic:
  - Rasterize the garden area into a grid; for each cell compute the estimated daily sun hours given the shadows cast by the buildings across the day (and ideally across the growing season)
  - Match cells against the plant's required sun hours (with a tolerance)
  - Cluster matching cells into contiguous zones and return the best zone(s), not just single points
- Output:
  - Highlighted area(s) on the map ("place it anywhere in this zone")
  - A short explanation ("this area gets ~6h of sun in summer, shaded by the house after 16h")
- Nice to have: also factor in companion planting (see below) and existing plants already on the map

---

## 2. Core features (the "product")

- **Per-plant diary / timeline** — photos over time so the user can see the plant's evolution. AI could compare photos to detect abnormal growth or stress.
- **Companion planting** — suggest which plants do well together or should be kept apart (e.g. tomato + basil yes, tomato + cabbage no).
- **Crop rotation** — for vegetable gardens, suggest what to plant next year in the same spot.
- **Extreme weather alerts** — cross a weather forecast API (e.g. OpenWeather) with the registered plants: "frost expected tonight, protect X and Y".
- **Evapotranspiration-based watering** — instead of "water 2x per week", use real climate/soil data to suggest an actual amount.

---

## 3. Social / community (important for distribution)

- **Share your garden publicly** (read-only link) — good for sharing in forums without exposing private data.
- **Swap plants/seeds with neighbours** — local marketplace-style feature, drives organic virality.
- **Ask the community** — if the AI is not confident in an identification/diagnosis, escalate to other users.

---

## 4. Gamification (retention; good for traction metrics)

- **Care streaks** — "you watered on all the right days this week".
- **Badges** — e.g. "first harvest", "survived the winter".

---

## 5. Technical features (worth points in interviews)

- **PWA with offline mode** — genuinely useful (gardens often have no wifi) and shows service worker skills.
- **Push notifications** — watering/pruning reminders; good excuse to learn it properly.
- **Export to calendar** (Google Calendar / iCal) — maintenance tasks as calendar events.

---

## 6. Ambitious / longer term

- **AI-generated garden layout planning** — the user gives the terrain shape + what they want to plant, and the AI suggests an optimized layout (spacing, sun, companion planting all combined). Builds on the sun-placement feature (#1) and companion planting (#2).
