import { Link } from 'react-router-dom'
import useScrollReveal from './useScrollReveal'
import FaintMindmapBackground from './FaintMindmapBackground'

interface AboutSection {
  title: string
  text: string
  img: string
  bulletPoints: string[]
}

const sections: AboutSection[] = [
  {
    title: 'Our Mission',
    text: 'We help visualize big ideas and break them into manageable steps using AI planning tools.',
    img: './assets/placeholder.svg',
    bulletPoints: [
      'Capture concepts quickly with intuitive mind maps',
      'Turn every idea into an actionable task',
      'Stay focused thanks to AI-driven guidance',
    ],
  },
  {
    title: 'Key Benefits',
    text: 'MindXdo keeps your plans and tasks together so you stay organized and focused.',
    img: './assets/placeholder.svg',
    bulletPoints: [
      'One workspace for mapping and doing',
      'Visual and list views always in sync',
      'Seamless flow from brainstorming to execution',
    ],
  },
  {
    title: 'Earn Rewards',
    text: 'Achieve milestones to unlock perks as you progress through your goals.',
    img: './assets/placeholder.svg',
    bulletPoints: [
      'Celebrate wins with badges and perks',
      'Level up productivity through gamification',
      'Share achievements with your team',
    ],
  },
  {
    title: 'Performance Insights',
    text: 'Track progress at a glance and let data drive your next move.',
    img: './assets/placeholder.svg',
    bulletPoints: [
      'Dashboards highlight your progress',
      'AI suggestions keep you on the right path',
      'Data-backed insights for continuous growth',
    ],
  },
  {
    title: 'Continuous Improvement',
    text: 'We evolve alongside your workflow so you can focus on what matters most.',
    img: './assets/placeholder.svg',
    bulletPoints: [
      'Frequent feature releases based on feedback',
      'Tools that scale with your ambitions',
      'A platform that grows as you do',
    ],
  },
]

export default function AboutPage(): JSX.Element {
  useScrollReveal()
  return (
    <div className="about-page">
      <section className="section section--one-col reveal relative overflow-hidden">
        <FaintMindmapBackground />
        <div className="about-hero-inner">
          <h1>About MindXdo</h1>
          <p>
            MindXdo blends mind maps and to‑do lists into a single workflow so you
            can plan and execute without friction.
          </p>
          <p>
            Capture ideas in seconds, break them into tasks, and watch our AI keep
            everything organized while you focus on the big picture.
          </p>
          <Link to="/purchase" className="btn">Purchase</Link>
        </div>
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
            <ul>
              {s.bulletPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          {i % 2 === 1 && (
            <img src={s.img} alt={s.title} width={400} height={400} />
          )}
        </section>
      ))}
    </div>
  )
}
