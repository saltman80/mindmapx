import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import FaintMindmapBackground from './FaintMindmapBackground'

export default function UpgradeRequired(): JSX.Element {
  return (
    <div className="upgrade-required">
      <section className="section text-center relative overflow-hidden">
        <FaintMindmapBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="form-card"
        >
          <h1 className="text-3xl font-bold mb-4">Upgrade Required</h1>
          <p className="mb-8">
            Using MindXdo allows you to build your vision map and connect the dots to your
            todo and task list to bring the map to life. Humans are visual people and using
            MindXdo allows you to visualize and create while staying organized.
          </p>
          <Link to="/login" className="btn">
            Back to Login
          </Link>
        </motion.div>
      </section>

      <section className="section section--one-col text-center">
        <div className="container text-center">
          <motion.img
            src="./assets/hero-mindmap.png"
            alt="Vision map"
            className="banner-image"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6 }}
          />
          <motion.h2
            className="marketing-text-large mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Build Your Vision Map
          </motion.h2>
        </div>
      </section>

      <section className="section section--one-col text-center section-bg-alt">
        <div className="container text-center">
          <motion.img
            src="./assets/hero-todo.png"
            alt="Connect todos"
            className="banner-image"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6 }}
          />
          <motion.h2
            className="marketing-text-large mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Connect Todos to Bring Ideas to Life
          </motion.h2>
        </div>
      </section>

      <section className="section section--one-col text-center">
        <div className="container text-center">
          <motion.img
            src="./assets/hero-collaboration.png"
            alt="Stay organized"
            className="banner-image"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6 }}
          />
          <motion.h2
            className="marketing-text-large mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Stay Organized and Visual
          </motion.h2>
        </div>
      </section>
    </div>
  )
}

