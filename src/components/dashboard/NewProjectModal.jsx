import { useState, useEffect, useRef } from 'react';

export default function NewProjectModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onCreate(trimmed);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <h2 style={{ marginBottom: '1rem' }}>New Project</h2>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Project Name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ marginBottom: '1rem', paddingLeft: '1rem' }}
        />
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}
