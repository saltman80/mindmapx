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
      'Let Mindxdo suggest tasks and connections so you can focus on the experience.',
    icon: './assets/placeholder.png',
  },
]

const Homepage: React.FC = (): JSX.Element => {
  const [loading, setLoading] = useState(false)
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

  const handleCheckout = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(
        '/.netlify/functions/create-checkout-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: 'mindmap_todo_pro' }),
        }
      )
      const data = await res.json()
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl
      } else {
        console.error('No session URL returned')
      }
    } catch (err) {
      console.error('Checkout error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="homepage">
      <section className="hero relative">
        <div className="shape shape-circle hero-shape1" />
        <div className="shape shape-circle hero-shape2" />
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Mindxdo: Mindmaps Meet Todos with AI</h1>
          <p>
            Experience the power of AI as your ideas become actionable plans.
            Mindxdo weaves mindmaps and todos together so you can strategize
            and execute without friction.
          </p>
          <button
            className="btn-primary"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Get Started'}
          </button>
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
      </section>



      <section className="features">
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
      </section>

      <section className="demo">
        <h2>Try It Live</h2>
        <p>Interactive demo of Mindxdo ? no signup required.</p>
        <Demo />
      </section>

      <section className="two-column">
        <div className="bold-marketing-text">
          Map your ideas visually while keeping tasks in focus.
        </div>
        <img
          src="./assets/placeholder.png"
          alt="Two column placeholder"
          className="banner-image"
        />
      </section>

      <section className="three-column">
        <div className="bold-marketing-text">Plan</div>
        <div className="bold-marketing-text">Track</div>
        <div className="bold-marketing-text">Launch</div>
      </section>

      <section className="ai-power relative">
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
          Mindxdo helps you execute ambitious plans with ease.
        </p>
        <img
          src="./assets/placeholder.png"
          alt="AI showcase"
          className="banner-image"
        />
      </section>

      <section className="pricing">
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
          <button
            className="btn-secondary"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upgrade Now'}
          </button>
        </motion.div>
      </section>

      <section className="faq">
        <h2>Frequently Asked Questions</h2>
        {[
          { q: 'What is Mindxdo?', a: 'An AI-driven experience blending mindmaps and todos.' },
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
      </section>

      <footer className="site-footer">
        <p>&copy; {new Date().getFullYear()} Mindxdo. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Homepage
