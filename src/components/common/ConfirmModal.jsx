export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" style={{ zIndex: 5000 }}>
      <div className="modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--amazon-dark)' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
