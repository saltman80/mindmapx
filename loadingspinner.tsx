import React from 'react'

interface LoadingSpinnerProps {
  size?: number | string
  color?: string
  className?: string
  ariaLabel?: string
}

function LoadingSpinner({
  size = 24,
  color = 'currentColor',
  className = '',
  ariaLabel = 'Loading',
}: LoadingSpinnerProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size

  return (
    <svg
      className={className}
      width={dimension}
      height={dimension}
      viewBox="0 0 50 50"
      role="status"
      aria-labelledby="loadingTitle"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="loadingTitle">{ariaLabel}</title>
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.75s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  )
}

export default LoadingSpinner