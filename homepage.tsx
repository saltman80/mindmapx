import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedAccordion from './animatedaccordion'
import FeatureCard from './featurecard'
import Demo from './demo'
import { CompactMindmapDemo } from './mindmapdemo'
import MindmapArm from './MindmapArm'
import FaintMindmapBackground from './FaintMindmapBackground'

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
    icon: './assets/feature-mind-mapping.png',
  },
  {
    title: 'Integrated To-Do Lists',
    description:
      'Link tasks to your mind map nodes and track progress effortlessly in one place.',
    icon: './assets/feature-todo-integration.png',
  },
  {
    title: 'Real-Time Collaboration',
    description:
      'Work together with your team on interactive maps and task lists in real time.',
    icon: './assets/feature-collaboration.png',
  },
  {
    title: 'Cross-Platform Sync',
    description:
      'Access your projects on any device with instant syncing and offline support.',
    icon: './assets/feature-cross-platform.png',
  },
  {
    title: 'AI Automation',
    description:
      'Let MindXdo suggest tasks and connections so you can focus on the experience.',
    icon: './assets/feature-ai-automation.png',
  },
  {
    title: 'Secure Cloud Storage',
    description:
      'Your data stays safe and synced across devices with encrypted cloud backup.',
    icon: './assets/feature-secure-storage.png',
  },
]

const faqItems = [
  { q: 'What is MindXdo?', a: 'An AI-driven experience blending mindmaps and todos.' },
  { q: 'How does the AI help?', a: 'It automates task creation and finds connections between ideas.' },
  { q: 'Can I collaborate with my team?', a: 'Yes, share maps and task boards in real time.' },
]

const Homepage: React.FC = (): JSX.Element => {
  const heroImages = [
    './assets/hero-mindmap.png',
    './assets/hero-todo.png',
    './assets/hero-collaboration.png',
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
      <section className="hero section relative overflow-hidden">
        <FaintMindmapBackground />
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
            Map a long‑term vision, break it down into tasks, and let MindXdo
            guide the next steps.
          </p>
          <Link to="/purchase" className="btn">
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

      <section className="section section--one-col section-bg-alt text-center" style={{ marginTop: '100px' }}>
        <div className="container text-center">
          <motion.h2
            className="marketing-text-large"
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <StackingText text="Mindmaps + Todos + Team Effort" />
          </motion.h2>
          <p className="section-subtext">Use AI to lay out visual plans and structure</p>
          <p className="section-subtext">
            Leverage our assistant to instantly convert ideas into organized mind maps.
          </p>
        </div>
      </section>

      <section className="section section--one-col section-bg-primary-light text-center">
        <div className="container text-center">
          <motion.h2
            className="marketing-text-large"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Rapidly prototype business ideas, flows, systems, and more.
          </motion.h2>
          <p className="section-subtext">
            Sketch processes and tasks in minutes and refine them with your team.
          </p>
          <div className="icon-row">
            <img src="./assets/placeholder.svg" alt="Flow icon" />
            <img src="./assets/placeholder.svg" alt="Checklist icon" />
            <img src="./assets/placeholder.svg" alt="Team icon" />
          </div>
        </div>
      </section>

      <section className="section section--one-col">
        <div className="container mini-mindmap-container">
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <CompactMindmapDemo />
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

      <section className="section section--one-col section-bg-alt text-center reveal relative overflow-hidden">
        <MindmapArm side="left" />
        <div className="container text-center">
          <img src="./assets/placeholder.svg" alt="" className="section-icon" />
          <h2 className="marketing-text-large">
            <StackingText text="Simple and Powerful" />
          </h2>
          <p className="section-subtext">
            Plan projects effortlessly with intuitive maps that grow alongside your ideas.
          </p>
        </div>
      </section>

      <section className="section section--one-col text-center reveal">
        <div className="container text-center">
          <img src="./assets/placeholder.svg" alt="" className="section-icon" />
          <motion.h2
            className="marketing-text-large"
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            AI Todo Lists Keep Teams Aligned
          </motion.h2>
          <p className="section-subtext">
            Assign tasks from your maps and watch progress unfold automatically.
          </p>
        </div>
      </section>

      <section className="section section--one-col section-bg-primary-light text-center reveal relative overflow-hidden">
        <MindmapArm side="right" />
        <div className="container text-center">
          <img src="./assets/placeholder.svg" alt="" className="section-icon" />
          <motion.h2
            className="marketing-text-large"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            See Beyond a Task Board
          </motion.h2>
          <p className="section-subtext">
            Mind map connections provide a bird's-eye view of every project step.
          </p>
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

      <section className="demo section section--one-col text-center">
        <div className="container text-center">
          <h2>Try It Live</h2>
          <p>Interactive demo of MindXdo – no signup required.</p>
          <Demo />
        </div>
      </section>

      <section className="section section--one-col">
        <div className="container">
          <div className="bold-marketing-text">
            Map your ideas visually while keeping tasks in focus.
          </div>
          <img
            src="./assets/integration-banner.png"
            alt="Visual integration banner"
            className="banner-image"
          />
        </div>
      </section>

      <section className="three-column section">
        <div className="container three-column">
          <div>
            <img src="./assets/placeholder.svg" alt="Plan" />
            <div className="bold-marketing-text">Plan</div>
          </div>
          <div>
            <img src="./assets/placeholder.svg" alt="Track" />
            <div className="bold-marketing-text">Track</div>
          </div>
          <div>
            <img src="./assets/placeholder.svg" alt="Launch" />
            <div className="bold-marketing-text">Launch</div>
          </div>
        </div>
      </section>

      <section className="ai-power section section--one-col text-center relative">
        <div className="container text-center">
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
          Harness automation to turn complex mind maps into actionable
          workflows. MindXdo helps you execute ambitious plans with ease.
          Mind maps show the big picture—our assistant suggests tasks and
          timelines so you never wonder what comes next.
        </p>
        <img
          src="./assets/ai-showcase.png"
          alt="AI showcase"
          className="banner-image"
        />
        </div>
      </section>

      <section className="pricing section section--one-col text-center">
        <div className="container text-center">
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
          <Link to="/purchase" className="btn">
            Upgrade Now
          </Link>
        </motion.div>
        </div>
      </section>

      <section className="faq section section--one-col text-center">
        <div className="container text-center">
          <h2>Frequently Asked Questions</h2>
          <AnimatedAccordion items={faqItems} />
        </div>
      </section>

    </div>
  )
}

export default Homepage
