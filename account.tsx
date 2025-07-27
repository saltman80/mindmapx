import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'

export default function AccountPage(): JSX.Element {
  return (
    <section className="section section--one-col relative overflow-hidden">
      <MindmapArm side="right" />
      <FaintMindmapBackground />
      <div className="form-card text-center space-y-4">
        <h1 className="text-2xl font-semibold mb-4">Account Settings</h1>
        <p>Manage your account preferences here.</p>
        <p>
          Status: <strong>Active</strong>
        </p>
        <button className="bg-red-600 text-white px-4 py-2 rounded">Cancel Account</button>
      </div>
      <div className="form-card limit-tile">
        <h2 className="text-xl font-semibold mb-2 text-center">Usage Limits</h2>
        <table className="sidebar-metrics">
          <tbody>
            <tr>
              <td className="metric-label">Mindmaps</td>
              <td className="metric-value">1/10</td>
            </tr>
            <tr>
              <td className="metric-label">Todo Lists</td>
              <td className="metric-value">0/100</td>
            </tr>
            <tr>
              <td className="metric-label">Kanban Boards</td>
              <td className="metric-value">0/10</td>
            </tr>
            <tr>
              <td className="metric-label">AI Automations</td>
              <td className="metric-value">0/25 this month</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
