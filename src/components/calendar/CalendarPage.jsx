import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppContext';
import { buildCareEventsForYear } from '../../utils/careEvents';
import Logo from '../common/Logo';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, inMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, date: new Date(year, month, d) });
  }
  while (cells.length % 7 !== 0) {
    const day = cells.length - (startOffset + daysInMonth) + 1;
    cells.push({ day, inMonth: false, date: new Date(year, month + 1, day) });
  }

  return cells;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = getMonthGrid(year, month);

  const careEventsByMonth = useMemo(
    () => buildCareEventsForYear(state.projects, year),
    [state.projects, year]
  );

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthEvents = careEventsByMonth.get(monthKey) || [];
  const pruneEvents = monthEvents.filter(e => e.type === 'prune');
  const fertilizeEvents = monthEvents.filter(e => e.type === 'fertilize');

  const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToToday = () => setViewDate(new Date());

  return (
    <div id="app">
      <div id="calendar-view" className="view">
        <div className="app-brand-row">
          <Logo size={34} />
        </div>

        <header>
          <button className="btn" onClick={() => navigate('/')} title="Back to Projects">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="title">Calendar</h1>
        </header>

        <div className="calendar-panel">
          <div className="calendar-toolbar">
            <button className="btn btn-icon" onClick={goToPrevMonth} title="Previous Month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h2 className="calendar-month-label">
              {MONTH_NAMES[month]} {year}
              {pruneEvents.length > 0 && (
                <span className="calendar-care-badge calendar-care-badge-prune">&#9986; {pruneEvents.length} to prune</span>
              )}
              {fertilizeEvents.length > 0 && (
                <span className="calendar-care-badge calendar-care-badge-fertilize">&#127793; {fertilizeEvents.length} to fertilize</span>
              )}
            </h2>
            <button className="btn btn-icon" onClick={goToNextMonth} title="Next Month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
            <button className="btn" onClick={goToToday}>Today</button>
          </div>

          <div className="calendar-grid calendar-weekdays">
            {WEEKDAYS.map(w => (
              <div key={w} className="calendar-weekday">{w}</div>
            ))}
          </div>

          <div className="calendar-grid calendar-days">
            {cells.map((cell, i) => (
              <div
                key={i}
                className={`calendar-day${cell.inMonth ? '' : ' calendar-day-outside'}${isSameDay(cell.date, today) ? ' calendar-day-today' : ''}`}
              >
                <span className="calendar-day-number">{cell.day}</span>
              </div>
            ))}
          </div>

          {(pruneEvents.length > 0 || fertilizeEvents.length > 0) && (
            <div className="calendar-care-list">
              {pruneEvents.length > 0 && (
                <div className="calendar-care-group">
                  <div className="calendar-care-group-title calendar-care-group-title-prune">&#9986; Prune this month</div>
                  {pruneEvents.map((e, i) => (
                    <div key={i} className="calendar-care-item">
                      <span className="calendar-care-item-plant" style={{ fontStyle: 'italic' }}>{e.plantName}</span>
                      <span className="calendar-care-item-project">{e.projectName}</span>
                    </div>
                  ))}
                </div>
              )}
              {fertilizeEvents.length > 0 && (
                <div className="calendar-care-group">
                  <div className="calendar-care-group-title calendar-care-group-title-fertilize">&#127793; Fertilize this month</div>
                  {fertilizeEvents.map((e, i) => (
                    <div key={i} className="calendar-care-item">
                      <span className="calendar-care-item-plant" style={{ fontStyle: 'italic' }}>{e.plantName}</span>
                      <span className="calendar-care-item-project">{e.projectName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
