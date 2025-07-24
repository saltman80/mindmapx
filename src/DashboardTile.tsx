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
  onCreate?: () => void
  moreLink?: string
}

export default function DashboardTile({ icon, title, items = [], onCreate, moreLink }: DashboardTileProps) {
  return (
    <div className="card">
      <div className="card-header">
        {icon}
        {title}
      </div>
      {onCreate && (
        <button className="btn-create" onClick={onCreate}>+ Create</button>
      )}
      {items.length > 0 && <div className="card-subtitle">Recent</div>}
      <ul className="recent-links">
        {items.map(item => (
          <li key={item.id}>
            <Link to={item.link}>{item.label}</Link>
          </li>
        ))}
      </ul>
      {moreLink && (
        <Link to={moreLink} className="card-more">See All</Link>
      )}
    </div>
  )
}
