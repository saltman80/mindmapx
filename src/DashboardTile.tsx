import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface DashboardItem {
  id: string
  label: string
  link: string
}

interface DashboardTileProps {
  icon?: ReactNode
  title: string
  items?: DashboardItem[]
  metrics?: ReactNode
  onCreate?: () => void
  moreLink?: string
}

export default function DashboardTile({ icon, title, items = [], metrics, onCreate, moreLink }: DashboardTileProps) {
  return (
    <div className={`dashboard-tile${onCreate ? ' can-create' : ''}`}>
      <header className="tile-header">
        <div className="tile-title">
          {icon && <span className="dashboard-icon">{icon}</span>}
          <h2>{title}</h2>
        </div>
        {moreLink && (
          <Link to={moreLink} className="tile-link">
            See All
          </Link>
        )}
      </header>
      {items.length > 0 && (
        <ul className="recent-list">
          {items.map(item => (
            <li key={item.id}>
              <Link to={item.link}>{item.label}</Link>
            </li>
          ))}
        </ul>
      )}
      {metrics && <div className="tile-stats">{metrics}</div>}
      {onCreate && (
        <footer className="tile-footer">
          <button className="btn-create" onClick={onCreate}>
            <span className="btn-plus" aria-hidden="true">+</span>
            Create
          </button>
        </footer>
      )}
    </div>
  )
}
