import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'

export default function TeamMembers() {
  return (
    <section className="section relative overflow-hidden">
      <MindmapArm side="right" />
      <FaintMindmapBackground />
      <div className="team-page">
        <div className="form-container text-center">
          <h1 className="mb-4">Team Members</h1>
          <p className="mt-4">Team management coming soon.</p>
        </div>
      </div>
    </section>
  )
}
