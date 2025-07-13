function useScrollAnimation(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current
    if (!element || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    observer.observe(element)
    return () => {
      observer.unobserve(element)
    }
  }, [ref])
}

const FeatureBlock: FC<FeatureBlockProps> = ({ title, description }) => {
  const blockRef = useRef<HTMLDivElement>(null)
  useScrollAnimation(blockRef)

  return (
    <div ref={blockRef} className="feature-block">
      <h2 className="feature-block__title">{title}</h2>
      <p className="feature-block__description">{description}</p>
    </div>
  )
}

export default FeatureBlock