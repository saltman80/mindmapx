import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import FaintMindmapBackground from './FaintMindmapBackground'
import useScrollReveal from './useScrollReveal'

export default function UpgradeRequired(): JSX.Element {
  useScrollReveal()
  const reasons = [
    'Map your vision visually so nothing is lost',
    'Turn ideas into actionable todos with a click',
    'Track progress on an integrated Kanban board',
    'Collaborate visually with your entire team',
    'Stay organized from concept to completion',
  ]

  return (
    <div className="upgrade-required">
      <section className="section text-center relative overflow-hidden">
        <FaintMindmapBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="about-hero-inner"
        >
          <h1 className="marketing-text-large">Purchase MindXdo</h1>
          <p className="section-subtext">
            Using MindXdo allows you to build your vision map and connect the dots to your
            todo and task list to bring the map to life. Humans are visual people and using
            MindXdo allows you to visualize and create while staying organized.
          </p>
          <ul className="text-left list-disc list-inside mt-4 mb-8">
            {reasons.map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <Link to="/login" className="btn">
            Back to Login
          </Link>
        </motion.div>
      </section>

      <section className="about-section reveal">
        <motion.img
          src="./assets/hero-mindmap.png"
          alt="Vision map"
          width={400}
          height={400}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
        />
        <div>
          <motion.h2
            className="marketing-text-large"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Build Your Vision Map
          </motion.h2>
          <p className="section-subtext">
            Capture your ideas in a visual map that clarifies the direction for every project.
          </p>
        </div>
      </section>

      <section className="about-section reveal reverse">
        <motion.img
          src="./assets/hero-todo.png"
          alt="Connect todos"
          width={400}
          height={400}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
        />
        <div>
          <motion.h2
            className="marketing-text-large"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Connect Todos to Bring Ideas to Life
          </motion.h2>
          <p className="section-subtext">
            Send map branches directly to your todo list so inspiration becomes action.
          </p>
        </div>
      </section>

      <section className="about-section reveal">
        <motion.img
          src="./assets/hero-collaboration.png"
          alt="Stay organized"
          width={400}
          height={400}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
        />
        <div>
          <motion.h2
            className="marketing-text-large"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Stay Organized and Visual
          </motion.h2>
          <p className="section-subtext">
            Track work on Kanban lanes while your vision map keeps everyone aligned.
          </p>
        </div>
      </section>
    </div>
  )
}

