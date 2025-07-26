import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface DashboardItem {
  id: string
  label: ReactNode | string
  link: string
  subText?: string
}

interface DashboardTileProps {
  icon?: ReactNode
  title: string
  items?: DashboardItem[]
  metrics?: ReactNode
  onCreate?: () => void
  moreLink?: string
  listClassName?: string
}

export default function DashboardTile({ icon, title, items = [], metrics, onCreate, moreLink, listClassName = 'recent-list' }: DashboardTileProps) {
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
        <ul className={listClassName}>
          {items.map(item => (
            <li key={item.id}>
              <Link to={item.link} className="dashboard-link">
                {item.label}
              </Link>
              {item.subText && (
                <span className="dashboard-subtext">{item.subText}</span>
              )}
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
