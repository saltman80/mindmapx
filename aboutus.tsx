export function AboutUs(): JSX.Element {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <section
      id="about"
      ref={ref}
      className={`py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-opacity transition-transform duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <img
        src="https://placehold.co/1200x400/png"
        alt="About us banner"
        className="about-banner mb-6"
      />
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 text-center">
        About Mindxdo
      </h2>
      <p className="mt-4 text-lg text-gray-600 text-center max-w-3xl mx-auto">
        Mindxdo is the ultimate productivity suite that merges visual mindmapping with
        intelligent todo automation. Whether you're sketching a grand vision or tracking
        daily tasks, Mindxdo adapts to your workflow so you stay organized with ease.
      </p>
      <p className="mt-4 text-lg text-gray-600 text-center max-w-3xl mx-auto">
        Founded by productivity enthusiasts, our mission is to empower individuals and teams
        to bring clarity to their work, foster collaboration, and achieve goals with confidence.
        Join thousands of users who have transformed their ideas into actionable plans
        with Mindxdo ? the X stands for experience.
      </p>

      <section className="two-column">
        <div className="bold-marketing-text">
          Seamlessly bridge brainstorming and execution with our intuitive tools.
        </div>
        <img
          src="https://placehold.co/800x600/png"
          alt="Product screenshot"
          className="banner-image"
        />
      </section>

      <section className="three-column">
        <div className="bold-marketing-text">Collaborate</div>
        <div className="bold-marketing-text">Organize</div>
        <div className="bold-marketing-text">Succeed</div>
      </section>
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <a
          href="#features"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md text-center font-medium hover:bg-blue-700 transition"
        >
          Explore Features
        </a>
        <a
          href="#team"
          className="inline-block bg-gray-100 text-blue-600 px-6 py-3 rounded-md text-center font-medium hover:bg-gray-200 transition"
        >
          Meet the Team
        </a>
      </div>
    </section>
  )
}
