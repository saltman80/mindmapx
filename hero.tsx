function initAnimation(canvasRef: React.RefObject<HTMLCanvasElement>): () => void {
  const canvas = canvasRef.current
  if (!canvas) return () => {}
  const ctx = canvas.getContext('2d')
  let animationFrameId: number
  let particles: Particle[] = []
  let cssWidth = 0
  let cssHeight = 0
  let pixelWidth = 0
  let pixelHeight = 0

  const resizeHandler = () => {
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    cssWidth = rect.width
    cssHeight = rect.height
    pixelWidth = rect.width * dpr
    pixelHeight = rect.height * dpr
    canvas.width = pixelWidth
    canvas.height = pixelHeight
    ctx?.resetTransform()
    ctx?.scale(dpr, dpr)
  }

  const initParticles = () => {
    particles = []
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * cssWidth,
        y: Math.random() * cssHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 1 + Math.random() * 3,
        hue: Math.random() * 360,
      })
    }
  }

  const animate = () => {
    if (!ctx) return
    ctx.clearRect(0, 0, pixelWidth, pixelHeight)
    particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > cssWidth) p.vx *= -1
      if (p.y < 0 || p.y > cssHeight) p.vy *= -1
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `hsl(${p.hue}, 70%, 60%)`
      ctx.fill()
    })
    animationFrameId = requestAnimationFrame(animate)
  }

  const onResize = () => {
    resizeHandler()
    initParticles()
  }

  resizeHandler()
  initParticles()
  window.addEventListener('resize', onResize)
  animate()

  return () => {
    cancelAnimationFrame(animationFrameId)
    window.removeEventListener('resize', onResize)
  }
}

const Hero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cleanup = initAnimation(canvasRef)
    return cleanup
  }, [])

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="shape shape-circle hero-shape1" />
      <div className="shape shape-circle hero-shape2" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
          MindXdo
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
          AI helps auto-create your vision and todos so you build plans faster.
          Let automation generate maps and tasks so you can focus on bringing
          ideas to life.
        </p>
        <a
          href="#get-started"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
        >
          Get Started
        </a>
      </div>
    </section>
  )
}

export default Hero
