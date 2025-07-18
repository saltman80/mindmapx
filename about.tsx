import { Link } from 'react-router-dom'
import useScrollReveal from './useScrollReveal'
import FaintMindmapBackground from './FaintMindmapBackground'

interface AboutSection {
  title: string
  text: string
  img: string
}

const sections: AboutSection[] = [
  {
    title: 'Our Mission',
    text: 'We help visualize big ideas and break them into manageable steps using AI planning tools.',
    img: './assets/placeholder.svg',
  },
  {
    title: 'Key Benefits',
    text: 'MindXdo keeps your plans and tasks together so you stay organized and focused.',
    img: './assets/placeholder.svg',
  },
  {
    title: 'Earn Rewards',
    text: 'Achieve milestones to unlock perks as you progress through your goals.',
    img: './assets/placeholder.svg',
  },
  {
    title: 'Performance Insights',
    text: 'Track progress at a glance and let data drive your next move.',
    img: './assets/placeholder.svg',
  },
  {
    title: 'Continuous Improvement',
    text: 'We evolve alongside your workflow so you can focus on what matters most.',
    img: './assets/placeholder.svg',
  },
]

export default function AboutPage(): JSX.Element {
  useScrollReveal()
  return (
    <div className="about-page">
      <section className="section section--one-col reveal relative overflow-hidden">
        <FaintMindmapBackground />
        <h1>About MindXdo</h1>
        <p>
          MindXdo blends mind maps and to‑do lists into a single workflow so you
          can plan and execute without friction.
        </p>
        <Link to="/payment" className="btn">Purchase</Link>
      </section>
      {sections.map((s, i) => (
        <section
          className={`about-section reveal${i % 2 ? ' reverse' : ''}`}
          key={s.title}
        >
          {i % 2 === 0 && (
            <img src={s.img} alt={s.title} width={400} height={400} />
          )}
          <div>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
          </div>
          {i % 2 === 1 && (
            <img src={s.img} alt={s.title} width={400} height={400} />
          )}
        </section>
      ))}
    </div>
  )
}
