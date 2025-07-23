import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'

export default function AccountPage(): JSX.Element {
  return (
    <section className="section relative overflow-hidden">
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
    </section>
  )
}
