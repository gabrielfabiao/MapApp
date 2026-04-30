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

const weatherCodes = {
    0: { label: 'Clear sky', icon: '☀️' },
    1: { label: 'Mainly clear', icon: '🌤️' },
    2: { label: 'Partly cloudy', icon: '⛅' },
    3: { label: 'Overcast', icon: '☁️' },
    45: { label: 'Fog', icon: '🌫️' },
    48: { label: 'Depositing rime fog', icon: '🌫️' },
    51: { label: 'Drizzle: Light', icon: '🌦️' },
    53: { label: 'Drizzle: Moderate', icon: '🌦️' },
    55: { label: 'Drizzle: Dense intensity', icon: '🌦️' },
    61: { label: 'Rain: Slight', icon: '🌧️' },
    63: { label: 'Rain: Moderate', icon: '🌧️' },
    65: { label: 'Rain: Heavy intensity', icon: '🌧️' },
    71: { label: 'Snow fall: Slight', icon: '🌨️' },
    73: { label: 'Snow fall: Moderate', icon: '🌨️' },
    75: { label: 'Snow fall: Heavy intensity', icon: '🌨️' },
    80: { label: 'Rain showers: Slight', icon: '🌦️' },
    81: { label: 'Rain showers: Moderate', icon: '🌦️' },
    82: { label: 'Rain showers: Violent', icon: '🌧️' },
    95: { label: 'Thunderstorm: Slight or moderate', icon: '⛈️' },
};

export function syncWeatherPanel(state, renderApp) {
    const weatherContent = document.getElementById('weather-content');
    if (!weatherContent) return;

    // Avoid redundant re-renders and flickering during high-frequency events like panning
    const renderKey = `${state.selectedWeatherDay}-${state.weatherData ? state.weatherData.daily.time[0] : 'none'}`;
    if (weatherContent.dataset.renderKey === renderKey) return;
    weatherContent.dataset.renderKey = renderKey;

    if (!state.weatherData) {
        weatherContent.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                Set a location in the Sun Env panel and open this panel to load the forecast.
            </div>
        `;
        return;
    }

    const daily = state.weatherData.daily;
    const daysHtml = daily.time.map((time, idx) => {
        const code = daily.weathercode[idx];
        const info = weatherCodes[code] || { label: 'Unknown', icon: '❓' };
        const max = daily.temperature_2m_max[idx];
        const min = daily.temperature_2m_min[idx];
        const date = new Date(time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const isActive = state.selectedWeatherDay === idx;

        return `
            <div class="weather-day-item ${isActive ? 'active' : ''}" data-idx="${idx}">
                <div class="weather-icon">${info.icon}</div>
                <div class="weather-info">
                    <div class="weather-date">${date}</div>
                    <div class="weather-temp">${info.label} • ${min}° / ${max}°</div>
                </div>
            </div>
            ${isActive ? `
                <div class="weather-details fade-in">
                    <div><strong>Precipitation:</strong> ${daily.precipitation_sum[idx]} mm</div>
                    <div><strong>Max UV Index:</strong> ${daily.uv_index_max[idx]}</div>
                </div>
            ` : ''}
        `;
    }).join('');

    weatherContent.innerHTML = daysHtml;

    // Attach click events
    weatherContent.querySelectorAll('.weather-day-item').forEach(el => {
        el.onclick = () => {
            const idx = parseInt(el.dataset.idx);
            state.selectedWeatherDay = idx;
            
            // Auto-update the date in the state to match the selected weather day
            const selectedDate = new Date(daily.time[idx]);
            // Keep the time if possible, or just set to noon
            const oldDate = new Date(state.sunDate);
            selectedDate.setHours(oldDate.getHours(), oldDate.getMinutes());
            state.sunDate = selectedDate;
            
            renderApp();
        };
    });
}
