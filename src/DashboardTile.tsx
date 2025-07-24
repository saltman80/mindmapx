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
    <div className="dashboard-tile">
      <div className="tile-header">
        {icon && <span className="dashboard-icon">{icon}</span>}
        <h2>{title}</h2>
        {onCreate && (
          <button className="btn-primary btn-wide" onClick={onCreate}>Create</button>
        )}
        {moreLink && <Link to={moreLink} className="tile-link">See All</Link>}
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
      {metrics && <div className="tile-stats">{metrics}</div>}
    </div>
  )
}
