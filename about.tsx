import { Link } from 'react-router-dom'
import useScrollReveal from './useScrollReveal'
import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'

interface AboutSection {
  title: string
  text: string
  img: string
  bulletPoints: string[]
}

const sections: AboutSection[] = [
  {
    title: 'Our Mission',
    text: 'MindXdo unites mind maps, todos and Kanban so every task stays linked to the big picture you want to achieve.',
    img: './assets/marketing_square_mindmap_people.png',
    bulletPoints: [
      'Capture concepts quickly with intuitive mind maps',
      'Send ideas to your todo list or board with one click',
      'Stay focused thanks to AI-driven guidance',
    ],
  },
  {
    title: 'Key Benefits',
    text: 'Build your mind map, auto-create todos and track them on an agile Kanban board so the entire plan stays connected.',
    img: './assets/marketing_square_lightbulb_team.png',
    bulletPoints: [
      'One workspace for mapping and doing',
      'Kanban board shows todo progress at a glance',
      'Visual and list views always in sync',
      'Invite teammates to plan and build',
    ],
  },
  {
    title: 'Performance Insights',
    text: 'Dashboards reveal how tasks flow from mind map to todo to Kanban so you never lose sight of the whole plan.',
    img: './assets/marketing_square_todolist_in_cloud.png',
    bulletPoints: [
      'Dashboards highlight your progress',
      'AI suggestions keep you on the right path',
      'Prebuilt templates jumpstart your workflow',
    ],
  },
  {
    title: 'Continuous Improvement',
    text: 'Add tasks manually or let AI expand your map—our Kanban system adapts as your projects grow while keeping everything tied to your vision.',
    img: './assets/marketing_square_ai_connecting.png',
    bulletPoints: [
      'Frequent feature releases based on feedback',
      'Tools that scale with your ambitions',
      'Use AI or manual mode to evolve your plan',
    ],
  },
]

export default function AboutPage(): JSX.Element {
  useScrollReveal()
  return (
    <div className="about-page">
      <section className="section section--one-col reveal relative overflow-x-visible">
        <MindmapArm side="left" />
        <FaintMindmapBackground />
        <div className="about-hero-inner">
          <h1>About MindXdo</h1>
          <p>
            Vision Meets Action. Build ideas in a mind map, send them to your
            todo list and manage progress on a shared Kanban board so you always see the big picture.
          </p>
          <p>
            Use each tool alone or combine them with AI to guide your team to
            success.
          </p>
          <Link to="/purchase" className="btn">Purchase</Link>
        </div>
      </section>
      {sections.map((s, i) => (
        <section
          className={`about-section reveal${i === 0 ? ' is-visible' : ''}${
            i % 2 ? ' reverse' : ''}`}
          key={s.title}
        >
          <MindmapArm side={i % 2 ? 'right' : 'left'} />
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
