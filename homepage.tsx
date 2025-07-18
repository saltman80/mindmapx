import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import FeatureCard from './featurecard'
import Demo from './demo'
import MindmapDemo from './mindmapdemo'

const StackingText: React.FC<{ text: string }> = ({ text }) => (
  <span className="stacking-text">
    {text.split('').map((ch, i) => (
      <motion.span
        key={i}
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.05 }}
      >
        {ch}
      </motion.span>
    ))}
  </span>
)
const features = [
  {
    title: 'Mind Mapping',
    description:
      'Visualize your ideas with dynamic, draggable mind maps that expand as you think.',
    icon: './assets/placeholder.png',
  },
  {
    title: 'Integrated To-Do Lists',
    description:
      'Link tasks to your mind map nodes and track progress effortlessly in one place.',
    icon: './assets/placeholder.png',
  },
  {
    title: 'Real-Time Collaboration',
    description:
      'Work together with your team on interactive maps and task lists in real time.',
    icon: './assets/placeholder.png',
  },
  {
    title: 'Cross-Platform Sync',
    description:
      'Access your projects on any device with instant syncing and offline support.',
    icon: './assets/placeholder.png',
  },
  {
    title: 'AI Automation',
    description:
      'Let MindXdo suggest tasks and connections so you can focus on the experience.',
    icon: './assets/placeholder.png',
  },
  {
    title: 'Secure Cloud Storage',
    description:
      'Your data stays safe and synced across devices with encrypted cloud backup.',
    icon: './assets/placeholder.png',
  },
]

const Homepage: React.FC = (): JSX.Element => {
  const heroImages = [
    './assets/placeholder.png',
    './assets/placeholder.png',
    './assets/placeholder.png',
  ]
  const [currentHero, setCurrentHero] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentHero(i => (i + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])


  return (
    <div className="homepage">
      <section className="hero section relative">
        <div className="container">
        <div className="shape shape-circle hero-shape1" />
        <div className="shape shape-circle hero-shape2" />
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="hero-title">MindXdo: Mindmaps Meet Todos with AI</h1>
          <p>
            Experience the power of AI as your ideas become actionable plans.
            MindXdo weaves mindmaps and todos together so you can strategize
            and execute without friction.
          </p>
          <Link to="/payment" className="btn">
            Get Started
          </Link>
        </motion.div>
        <div className="banner-slider">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentHero}
              src={heroImages[currentHero]}
              alt="Hero banner"
              className="banner-image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          </AnimatePresence>
        </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="marketing-text-large">
            <StackingText text="Mindmaps + Todos + Team Effort" />
          </h2>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <motion.h2
            className="marketing-text-large"
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Use AI to lay out visual plans and structure
          </motion.h2>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <motion.h2
            className="marketing-text-large"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Rapidly prototype business ideas, flows, systems, and more.
          </motion.h2>
        </div>
      </section>

      <section className="section">
        <div className="container two-column mini-mindmap-container">
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <MindmapDemo />
          </motion.div>
          <motion.div
            className="marketing-text-large"
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            See how AI instantly creates a map for your ideas.
          </motion.div>
        </div>
      </section>


      <section className="features section">
        <div className="container">
        <h2>Features</h2>
        <div className="feature-grid">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-item"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <FeatureCard
                icon={f.icon}
                title={f.title}
                description={f.description}
              />
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      <section className="demo section">
        <div className="container">
          <h2>Try It Live</h2>
          <p>Interactive demo of MindXdo – no signup required.</p>
          <Demo />
        </div>
      </section>

      <section className="two-column section">
        <div className="container two-column">
          <div className="bold-marketing-text">
            Map your ideas visually while keeping tasks in focus.
          </div>
          <img
            src="./assets/placeholder.png"
            alt="Two column placeholder"
            className="banner-image"
          />
        </div>
      </section>

      <section className="three-column section">
        <div className="container three-column">
          <div className="bold-marketing-text">Plan</div>
          <div className="bold-marketing-text">Track</div>
          <div className="bold-marketing-text">Launch</div>
        </div>
      </section>

      <section className="ai-power section relative">
        <div className="container">
        <div className="shape shape-circle ai-power-shape" />
        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          AI Superpowers
        </motion.h2>
        <p className="ai-copy">
          Harness automation to turn complex mindmaps into actionable workflows.
          MindXdo helps you execute ambitious plans with ease.
        </p>
        <img
          src="./assets/placeholder.png"
          alt="AI showcase"
          className="banner-image"
        />
        </div>
      </section>

      <section className="pricing section">
        <div className="container">
        <motion.div
          className="pricing-content"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2>Pro Plan</h2>
          <p className="price">$9.99 / month</p>
          <ul>
            <li>Unlimited mind maps</li>
            <li>Advanced collaboration</li>
            <li>Priority support</li>
            <li>All future features</li>
          </ul>
          <Link to="/payment" className="btn">
            Upgrade Now
          </Link>
        </motion.div>
        </div>
      </section>

      <section className="faq section">
        <div className="container">
        <h2>Frequently Asked Questions</h2>
        {[
          { q: 'What is MindXdo?', a: 'An AI-driven experience blending mindmaps and todos.' },
          { q: 'How does the AI help?', a: 'It automates task creation and finds connections between ideas.' },
          { q: 'Can I collaborate with my team?', a: 'Yes, share maps and task boards in real time.' },
        ].map(item => (
          <motion.div key={item.q} className="faq-item" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <details>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          </motion.div>
        ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} MindXdo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Homepage
