import React from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showArea?: boolean
}

export default function Sparkline({
  data,
  width = 100,
  height = 40,
  color = '#38bdf8',
  showArea = false,
}: SparklineProps) {
  const max = Math.max(...data, 1)
  const linePoints = data
    .map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width
      const y = height - (d / max) * height
      return `${x},${y}`
    })
    .join(' ')
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`

  return (
    <svg
      className="sparkline"
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <line
        x1="0"
        y1={height}
        x2={width}
        y2={height}
        stroke={color}
        strokeWidth="1"
        opacity="0.2"
      />
      {showArea && (
        <polygon
          fill={color}
          fillOpacity="0.1"
          stroke="none"
          points={areaPoints}
        />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        points={linePoints}
      />
    </svg>
  )
}
