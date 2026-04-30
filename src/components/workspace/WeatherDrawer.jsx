import { useAppState } from '../../context/AppContext';

const weatherCodes = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Depositing rime fog', icon: '🌫️' },
  51: { label: 'Drizzle: Light', icon: '🌦️' },
  53: { label: 'Drizzle: Moderate', icon: '🌦️' },
  55: { label: 'Drizzle: Dense', icon: '🌦️' },
  61: { label: 'Rain: Slight', icon: '🌧️' },
  63: { label: 'Rain: Moderate', icon: '🌧️' },
  65: { label: 'Rain: Heavy', icon: '🌧️' },
  71: { label: 'Snow: Slight', icon: '🌨️' },
  73: { label: 'Snow: Moderate', icon: '🌨️' },
  75: { label: 'Snow: Heavy', icon: '🌨️' },
  80: { label: 'Rain showers: Slight', icon: '🌦️' },
  81: { label: 'Rain showers: Moderate', icon: '🌦️' },
  82: { label: 'Rain showers: Violent', icon: '🌧️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
};

export default function WeatherDrawer() {
  const { state, dispatch } = useAppState();

  const handleDayClick = (idx, daily) => {
    const selectedDate = new Date(daily.time[idx]);
    const oldDate = new Date(state.sunDate);
    selectedDate.setHours(oldDate.getHours(), oldDate.getMinutes());
    dispatch({ type: 'SET_WEATHER_DAY', day: idx });
    dispatch({ type: 'SET_SUN_DATE', date: selectedDate });
  };

  const renderContent = () => {
    if (!state.weatherData) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Set a location in the Sun Env panel and open this panel to load the forecast.
        </div>
      );
    }

    const daily = state.weatherData.daily;
    return daily.time.map((time, idx) => {
      const code = daily.weathercode[idx];
      const info = weatherCodes[code] || { label: 'Unknown', icon: '❓' };
      const max = daily.temperature_2m_max[idx];
      const min = daily.temperature_2m_min[idx];
      const date = new Date(time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const isActive = state.selectedWeatherDay === idx;

      return (
        <div key={idx}>
          <div
            className={`weather-day-item${isActive ? ' active' : ''}`}
            onClick={() => handleDayClick(idx, daily)}
          >
            <div className="weather-icon">{info.icon}</div>
            <div className="weather-info">
              <div className="weather-date">{date}</div>
              <div className="weather-temp">{info.label} • {min}° / {max}°</div>
            </div>
          </div>
          {isActive && (
            <div className="weather-details fade-in">
              <div><strong>Precipitation:</strong> {daily.precipitation_sum[idx]} mm</div>
              <div><strong>Max UV Index:</strong> {daily.uv_index_max[idx]}</div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={`sidebar-drawer left${state.isWeatherOpen ? ' open' : ''}`} id="weather-drawer">
      <div className="sidebar-panel">
        <div className="sidebar-panel-heading">Weekly Forecast</div>
        <div className="sidebar-scroll-area">
          <div id="weather-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
