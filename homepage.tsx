const features = [
  {
    title: 'Mind Mapping',
    description:
      'Visualize your ideas with dynamic, draggable mind maps that expand as you think.',
    icon: '/images/icon-mindmap.png',
  },
  {
    title: 'Integrated To-Do Lists',
    description:
      'Link tasks to your mind map nodes and track progress effortlessly in one place.',
    icon: '/images/icon-todo.png',
  },
  {
    title: 'Real-Time Collaboration',
    description:
      'Work together with your team on interactive maps and task lists in real time.',
    icon: '/images/icon-collaboration.png',
  },
  {
    title: 'Cross-Platform Sync',
    description:
      'Access your projects on any device with instant syncing and offline support.',
    icon: '/images/icon-sync.png',
  },
]

const Homepage: React.FC = (): JSX.Element => {
  const [loading, setLoading] = useState(false)
  const heroImages = [
    '/images/banner1.png',
    '/images/banner2.png',
    '/images/banner3.png',
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
      <section className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Mindmap ? Todo: Organize Ideas, Get Things Done</h1>
          <p>
            The ultimate productivity tool that combines visual brainstorming
            with task management. Plan, prioritize, and execute?all in one
            place.
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
        <p>Interactive demo of Mindmap ? Todo?no signup required.</p>
        <Demo />
      </section>

      <section className="two-column">
        <div className="bold-marketing-text">
          Map your ideas visually while keeping tasks in focus.
        </div>
        <img
          src="/images/marketing-two-col.png"
          alt="Two column placeholder"
          className="banner-image"
        />
      </section>

      <section className="three-column">
        <div className="bold-marketing-text">Plan</div>
        <div className="bold-marketing-text">Track</div>
        <div className="bold-marketing-text">Launch</div>
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

      <footer className="site-footer">
        <p>&copy; {new Date().getFullYear()} Mindmap ? Todo. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Homepage