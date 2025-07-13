const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <FaHome />, path: '/dashboard' },
  { id: 'mindmaps', label: 'Mindmaps', icon: <FaProjectDiagram />, path: '/mindmaps' },
  { id: 'todos', label: 'Todos', icon: <FaClipboardList />, path: '/todos' },
  {
    id: 'users',
    label: 'Users',
    icon: <FaUsers />,
    path: '/admin/users',
    children: [
      { id: 'manageUsers', label: 'Manage Users', icon: <FaUsers />, path: '/admin/users/manage' },
      { id: 'analytics', label: 'Analytics', icon: <FaUsers />, path: '/admin/users/analytics' }
    ]
  },
  { id: 'settings', label: 'Settings', icon: <FaCog />, path: '/settings' }
]

const renderMenuItems = (items: MenuItem[], collapsed: boolean): JSX.Element[] =>
  items.map(item => (
    <li key={item.id} role="none" className="sidebar-item">
      <NavLink
        to={item.path}
        role="menuitem"
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        aria-haspopup={item.children ? true : undefined}
        aria-expanded={item.children ? !collapsed : undefined}
      >
        <div className="sidebar-icon">{item.icon}</div>
        {!collapsed && <span className="sidebar-label">{item.label}</span>}
      </NavLink>
      {!collapsed && item.children && (
        <ul role="menu" aria-label={`${item.label} submenu`} className="sidebar-submenu">
          {renderMenuItems(item.children, collapsed)}
        </ul>
      )}
    </li>
  ))

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const Sidebar: FC<SidebarProps> = ({ collapsed, onToggle }) => (
  <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} aria-label="Sidebar Navigation">
    <nav>
      <ul role="menu" className="sidebar-menu">
        {renderMenuItems(menuItems, collapsed)}
      </ul>
    </nav>
    <button
      type="button"
      onClick={onToggle}
      className="sidebar-toggle"
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
    </button>
  </aside>
)

export default Sidebar