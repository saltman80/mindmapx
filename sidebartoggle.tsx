const SidebarToggle: React.FC<SidebarToggleProps> = ({ isOpen, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
    aria-expanded={isOpen}
    className="sidebar-toggle"
  >
    {isOpen ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
      </svg>
    )}
  </button>
)

export default SidebarToggle