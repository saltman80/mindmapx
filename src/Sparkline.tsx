import React from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export default function Sparkline({
  data,
  width = 100,
  height = 40,
  color = '#38bdf8',
}: SparklineProps) {
  const max = Math.max(...data, 1)
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - (d / max) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      className="sparkline"
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}
