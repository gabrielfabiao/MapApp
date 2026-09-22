import { forwardRef } from 'react';

// Icon-on-top + caption-below button used throughout the workspace toolbar,
// so every action is labeled instead of relying on a hover-only `title`
// (which never shows on touch devices).
const ToolbarButton = forwardRef(function ToolbarButton(
  { id, icon, label, active, onClick, className = '', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      id={id}
      type="button"
      className={`toolbar-btn${active ? ' active' : ''} ${className}`.trim()}
      title={label}
      aria-label={label}
      onClick={onClick}
      {...rest}
    >
      <span className="toolbar-btn-icon">{icon}</span>
      <span className="toolbar-btn-label">{label}</span>
    </button>
  );
});

export default ToolbarButton;
