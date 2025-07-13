const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ onClick, type = 'button', children, ...props }, ref) => (
    <button ref={ref} type={type} onClick={onClick} {...props}>
      {children}
    </button>
  )
)

Button.displayName = 'Button'

export default Button