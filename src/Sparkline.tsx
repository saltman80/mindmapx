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
  color = '#0a84ff',
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
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  )
}
