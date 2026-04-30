import { useState, useEffect } from 'react';

const slides = [
  {
    header: '🌱 Welcome to Your Garden Map',
    title: 'Get Started',
    items: ['Create a project and upload a photo of your garden to begin.'],
  },
  {
    header: '📍 Adding Markers',
    title: 'Mark Points of Interest',
    items: [
      'Click anywhere on your image to drop a numbered marker.',
      'Click a marker to open the editor and add a title, description, and photos.',
      'Drag markers to reposition them.',
    ],
  },
  {
    header: '🌳 Plants & Species',
    title: 'Identify Your Plants',
    items: [
      'Add photos to a marker and use "Identify Plant" (requires a Pl@ntNet API key).',
      'View all species across your garden in the Plants tab.',
    ],
  },
  {
    header: '☀️ Sun Environment',
    title: 'Track Sunlight & Shadows',
    items: [
      'Set your location and time of day in the Sun Env tab.',
      'Draw buildings to cast realistic shadows on your map.',
      'Toggle Shadows on/off from the toolbar.',
    ],
  },
];

export default function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(c + 1, slides.length - 1));
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const open = () => { setCurrent(0); setIsOpen(true); };
  const close = () => setIsOpen(false);

  const handleNext = () => {
    if (current === slides.length - 1) close();
    else setCurrent(c => c + 1);
  };

  return (
    <>
      <button id="global-help-btn" className="global-help-btn" title="How it works" onClick={open}>?</button>

      {isOpen && (
        <div className="modal-overlay open" id="help-modal" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal help-modal-content">
            <span className="modal-close" onClick={close}>&times;</span>

            <div className="slideshow-container">
              {slides.map((slide, i) => (
                <div key={i} className={`help-slide${i === current ? ' active' : ''}`}>
                  <h2 className="help-slide-header">{slide.header}</h2>
                  <h3 className="help-slide-title">{slide.title}</h3>
                  <ul className="help-slide-list">
                    {slide.items.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <div className="help-slideshow-controls">
              <button className="btn btn-outline" onClick={() => setCurrent(c => Math.max(c - 1, 0))} disabled={current === 0}>&lt;</button>
              <div className="help-slideshow-dots">
                {slides.map((_, i) => (
                  <div key={i} className={`dot${i === current ? ' active' : ''}`} onClick={() => setCurrent(i)} />
                ))}
              </div>
              <button className="btn btn-primary" onClick={handleNext}>&gt;</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
