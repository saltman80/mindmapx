import { Link } from 'react-router-dom'
import useScrollReveal from './useScrollReveal'

export default function AboutPage(): JSX.Element {
  useScrollReveal()
  return (
    <div className="about-page">
      <section className="section section--one-col reveal">
        <h1>About MindXdo</h1>
        <p>
          MindXdo blends mind maps and to‑do lists into a single workflow so you
          can plan and execute without friction.
        </p>
        <Link to="/payment" className="btn">Purchase</Link>
      </section>
      <section className="section section--two-col reveal">
        <div>
          <h2>Our Mission</h2>
          <p>
            We help you visualize big ideas and break them down into manageable
            steps. Our AI planning tools jumpstart the process when you are not
            sure where to begin.
          </p>
        </div>
        <img src="./assets/placeholder.png" alt="Mission" />
      </section>
      <section className="section section--two-col reveal">
        <img src="./assets/placeholder.png" alt="Mind maps" />
        <div>
          <h2>Why Mind Maps + AI?</h2>
          <p>
            Mind maps are powerful for brainstorming but often stop short of
            action. MindXdo turns each node into a task so your vision becomes a
            roadmap you can follow manually or with AI‑generated suggestions.
          </p>
        </div>
      </section>
      <section className="section section--three-col reveal">
        <div>Plan</div>
        <div>Track</div>
        <div>Launch</div>
      </section>
    </div>
  )
}
