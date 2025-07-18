import { Link } from 'react-router-dom'
import useScrollReveal from './useScrollReveal'

export default function AboutPage(): JSX.Element {
  useScrollReveal()
  return (
    <div className="about-page">
      <section className="section section--one-col reveal">
        <h1>About MindXdo</h1>
        <p>MindXdo blends mindmaps and todos with AI so you can plan and execute seamlessly.</p>
        <Link to="/payment" className="btn">Purchase</Link>
      </section>
      <section className="section section--two-col reveal">
        <div>
          <h2>Our Mission</h2>
          <p>We help you visualize ideas and turn them into actionable tasks.</p>
        </div>
        <img src="./assets/placeholder.png" alt="Mission" />
      </section>
      <section className="section section--three-col reveal">
        <div>Plan</div>
        <div>Track</div>
        <div>Launch</div>
      </section>
    </div>
  )
}
