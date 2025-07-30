import FaintMindmapBackground from './FaintMindmapBackground'

export default function TrialExpired(): JSX.Element {
  return (
    <section className="section text-center relative overflow-hidden">
      <FaintMindmapBackground />
      <div className="form-card">
        <h1 className="text-2xl font-bold mb-4">Trial Expired</h1>
        <p className="mb-4">Your trial has ended. Purchase to continue using the app.</p>
        <a href="/purchase" className="btn">Purchase</a>
      </div>
    </section>
  )
}
