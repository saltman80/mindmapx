import FaintMindmapBackground from './FaintMindmapBackground'

export default function AccountPage(): JSX.Element {
  return (
    <section className="section relative overflow-hidden">
      <FaintMindmapBackground />
      <div className="form-card text-center">
        <h1 className="text-2xl font-semibold mb-4">Account Settings</h1>
        <p>Manage your account preferences here.</p>
      </div>
    </section>
  )
}
