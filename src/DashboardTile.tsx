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
    <div className={`dashboard-tile${onCreate ? ' highlight-create' : ''}`}>
      <div className="tile-header">
        {icon && <span className="dashboard-icon">{icon}</span>}
        <h2>{title}</h2>
        {moreLink && (
          <Link to={moreLink} className="tile-link tile-link-corner">
            See All
          </Link>
        )}
      </div>
      {items.length > 0 && (
        <ul className="recent-list">
          {items.map(item => (
            <li key={item.id}>
              <Link to={item.link}>{item.label}</Link>
            </li>
          ))}
        </ul>
      )}
      {onCreate && (
        <div className="tile-actions">
          <button className="btn-primary btn-wide" onClick={onCreate}>
            <span className="btn-plus" aria-hidden="true">+</span>
            Create
          </button>
        </div>
      )}
      {metrics && <div className="tile-stats">{metrics}</div>}
    </div>
  )
}
