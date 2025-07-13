const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 50,
  strokeWidth = 6,
  color = '#333',
  label = 'Loading...'
}) => (
  <div
    role="status"
    aria-label={label}
    aria-live="polite"
    style={{ display: 'inline-block', lineHeight: 0 }}
  >
    <span style={visuallyHiddenStyle}>{label}</span>
    <svg
      width={size}
      height={size}
      viewBox="0 0 66 66"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        cx="33"
        cy="33"
        r="30"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 33 33"
          to="360 33 33"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  </div>
)

export default LoadingSpinner