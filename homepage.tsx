import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import React from 'react'
import AnimatedAccordion from './animatedaccordion'
import FeatureCard from './featurecard'
import Demo from './demo'
import { CompactMindmapDemo } from './mindmapdemo'
import MindmapArm from './MindmapArm'

const StackingText: React.FC<{ text: string }> = ({ text }) => (
  <span className="stacking-text">
    {text.split('').map((ch, i) =>
      ch === '+' ? (
        <React.Fragment key={i}>
          <motion.span
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: i * 0.05 }}
          >
            {ch}
          </motion.span>
          <br className="mobile-linebreak" />
        </React.Fragment>
      ) : (
        <motion.span
          key={i}
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: i * 0.05 }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </motion.span>
      )
    )}
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
    title: 'AI Automation',
    description:
      'Let MindXdo suggest tasks and connections so you can focus on the experience.',
    icon: './assets/feature-ai-automation.png',
  },
  {
    title: 'Kanban Board',
    description:
      'Cards sync with your todos so you always know what is in progress and what is done.',
    icon: './assets/feature-kanban.png',
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
  { q: 'Is my data secure?', a: 'All information is encrypted and safely stored in the cloud.' },
  { q: 'Does it work on mobile devices?', a: 'MindXdo is accessible from any modern browser or device.' },
  { q: 'What if I need support?', a: 'Our team offers assistance and training whenever you need it.' },
  { q: 'How do I start?', a: 'Simply sign up and create your first mind map or to-do list.' },
]

const Homepage: React.FC = (): JSX.Element => {
  const heroImage = './assets/system_banner_people.png'


  return (
    <div id="top" tabIndex={-1} style={{ scrollMarginTop: '114px' }}>
      <div className="homepage">
        <section className="hero section relative overflow-x-visible">
        <div className="container">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="hero-title">
            <img src="./assets/logo.png" alt="MindXdo logo" className="hero-logo" />
            Vision Meets Action
          </h1>
          <p>
            Mindmaps connect todos to boards, turning ideas into executed vision.
          </p>
          <Link to="/purchase" className="btn">
            Get Started
          </Link>
        </motion.div>
        </div>
      </section>
      <section className="hero-banner">
        <img src={heroImage} alt="Hero banner" className="banner-image" />
      </section>

      <section className="section section--one-col section-bg-alt text-center">
        <div className="container text-center">
          <motion.h2
            className="marketing-text-large"
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <StackingText text="MindMap + Todo + Task Tracker" />
          </motion.h2>
          <p className="section-subtext">
            Map goals visually, then convert nodes into todos and Kanban cards.
          </p>
          <p className="section-subtext">
            AI expands the map so each task ties back to your board and vision.
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
            Create ideas, flows, systems, & more.
          </motion.h2>
          <p className="section-subtext">
            Sketch processes in a mind map and instantly generate todos that sync to your Kanban board for full visibility.
          </p>
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
            See how AI instantly creates a connected map so tasks flow right to your board.
          </motion.div>
        </div>
      </section>

      <section className="section section--one-col section-bg-alt text-center reveal relative overflow-x-visible">
        <MindmapArm side="left" />
        <div className="container text-center">
          <img src="./assets/feature-cross-platform.png" alt="Cross platform" className="section-icon" />
          <h2 className="marketing-text-large">
            <StackingText text="Simple and Powerful" />
          </h2>
          <p className="section-subtext">
            Plan projects effortlessly by sending tasks from the map to your Kanban board so the big picture never gets lost.
          </p>
        </div>
      </section>

      <section className="section text-center reveal">
        <div className="container two-column">
          <div>
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
              AI turns map nodes into actionable todos and linked Kanban cards, ensuring everyone knows the plan and stays aligned.
            </p>
          </div>
          <img
            src="./assets/hero-collaboration.png"
            alt="Collaboration"
            style={{ width: '400px' }}
          />
        </div>
      </section>

      <section className="section section--one-col section-bg-primary-light text-center reveal relative overflow-x-visible">
        <MindmapArm side="right" />
        <div className="container text-center">
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
            Mind map connections provide a bird's-eye view while Kanban boards track execution so teams see the full picture.
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


      <section className="section section--one-col">
        <div className="container">
          <div className="bold-marketing-text">
            AI auto-builds maps and todos so you can turn big ideas into complete plans while keeping your board in view.
          </div>
          <img
            src="./assets/simple_main_banner_home.png"
            alt="Visual integration banner"
            className="banner-image"
          />
        </div>
      </section>


      <section className="ai-power section section--one-col text-center relative">
        <div className="container text-center">
        <motion.h2
          className="marketing-text-large"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          AI Superpowers
        </motion.h2>
        <p className="ai-copy">
          Harness automation to turn complex mind maps into todos and Kanban workflows.
          AI builds out your plan so you can execute faster while staying aware of the big picture.
        </p>
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
            <li>Unlimited manual mind maps</li>
            <li>Unlimited manual todos</li>
            <li>Unlimited manual kanban</li>
            <li>AI assistance available</li>
            <li>Support &amp; Training Available</li>
          </ul>
          <Link to="/purchase" className="btn">
            Purchase Today &gt;
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
    </div>
  )
}

export default Homepage
