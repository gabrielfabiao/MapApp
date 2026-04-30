export async function fetchWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum&timezone=auto`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather fetch failed');
    return await response.json();
  } catch (err) {
    console.error('Weather Error:', err);
    return null;
  }
}
