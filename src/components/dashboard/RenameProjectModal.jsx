import { useState, useEffect, useRef } from 'react';

export default function RenameProjectModal({ isOpen, project, onClose, onRename }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && project) {
      setName(project.name);
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
    }
  }, [isOpen, project]);

  const handleRename = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onRename(trimmed);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRename();
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <h2 style={{ marginBottom: '1rem' }}>Rename Project</h2>
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
          <button className="btn btn-primary" onClick={handleRename}>Save</button>
        </div>
      </div>
    </div>
  );
}
