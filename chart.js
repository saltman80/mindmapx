const chartInstances = new WeakMap<HTMLCanvasElement, Chart>()

export function initChart(canvas: HTMLCanvasElement, config: ChartConfiguration): Chart {
  const existingChart = chartInstances.get(canvas)
  if (existingChart) {
    try {
      existingChart.destroy()
    } catch {}
    chartInstances.delete(canvas)
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2D context from canvas')
  const chart = new Chart(ctx, config)
  chartInstances.set(canvas, chart)
  return chart
}

export function updateChartData(chart: Chart, data: ChartData): void {
  chart.data.labels = data.labels ?? chart.data.labels
  chart.data.datasets = data.datasets ?? chart.data.datasets
  chart.update()
}

export function destroyChart(chart: Chart): void {
  if (!(chart instanceof Chart)) return
  const canvasEl = (chart.ctx as CanvasRenderingContext2D).canvas as HTMLCanvasElement
  if (canvasEl) {
    chartInstances.delete(canvasEl)
  }
  try {
    chart.destroy()
  } catch {}
}