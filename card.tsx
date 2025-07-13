const ALLOWED_PROPS = new Set([
  'id',
  'role',
  'style',
  'onClick',
  'onMouseEnter',
  'onMouseLeave',
])

function filterProps(props: CardProps): CardProps {
  const result: CardProps = {}
  Object.entries(props).forEach(([key, value]) => {
    if (ALLOWED_PROPS.has(key) || key.startsWith('aria-') || key.startsWith('data-')) {
      ;(result as any)[key] = value
    }
  })
  return result
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ children, className = '', ...props }, ref) => {
  const filtered = filterProps(props)
  return (
    <div ref={ref} className={`card ${className}`.trim()} {...filtered}>
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export default Card