const Chart: React.FC<ChartProps> = ({ data, type }) => {
  const [tooltipData, setTooltipData] = useState<DataPoint | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const showTooltip = useCallback((dp: DataPoint, e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setTooltipData(dp)
    setTooltipPos({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top + 10 })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltipData(null)
    setTooltipPos({ x: 0, y: 0 })
  }, [])

  const chartContent = useMemo(() => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip content={null} />
              <Bar
                dataKey="value"
                fill="#8884d8"
                onMouseOver={(d: any, index: number, e: React.MouseEvent) =>
                  showTooltip(d.payload, e)
                }
                onMouseOut={hideTooltip}
              >
                {data.map((_, i) => (
                  <Cell key={`cell-${i}`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip content={null} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#82ca9d"
                dot={false}
                activeDot={{
                  onMouseEnter: (d: any, index: number, e: React.MouseEvent) =>
                    showTooltip(d.payload, e),
                  onMouseLeave: hideTooltip,
                  r: 8,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <RechartsTooltip content={null} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                onMouseOver={(d: any, index: number, e: React.MouseEvent) =>
                  showTooltip(d.payload, e)
                }
                onMouseOut={hideTooltip}
              >
                {data.map((_, i) => (
                  <Cell key={`slice-${i}`} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }, [data, type, showTooltip, hideTooltip])

  const tooltipStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'absolute',
      top: tooltipPos.y,
      left: tooltipPos.x,
      background: 'rgba(255,255,255,0.9)',
      border: '1px solid #ccc',
      padding: '6px',
      borderRadius: '4px',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      zIndex: 1000,
    }),
    [tooltipPos]
  )

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: 300 }}>
      {chartContent}
      {tooltipData && (
        <div style={tooltipStyle}>
          <strong>{tooltipData.name}</strong>: {tooltipData.value}
        </div>
      )}
    </div>
  )
}

export default React.memo(Chart)