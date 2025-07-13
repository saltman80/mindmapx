const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange }) => {
  const startInputId = useId()
  const endInputId = useId()

  useEffect(() => {
    if (startDate > endDate) {
      onChange({ start: endDate, end: startDate })
    }
  }, [startDate, endDate, onChange])

  const formattedStart = format(startDate, 'yyyy-MM-dd')
  const formattedEnd = format(endDate, 'yyyy-MM-dd')

  const handleStartChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.valueAsDate
      if (!selected) return
      if (selected > endDate) {
        onChange({ start: selected, end: selected })
      } else {
        onChange({ start: selected, end: endDate })
      }
    },
    [endDate, onChange]
  )

  const handleEndChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.valueAsDate
      if (!selected) return
      if (selected < startDate) {
        onChange({ start: selected, end: selected })
      } else {
        onChange({ start: startDate, end: selected })
      }
    },
    [startDate, onChange]
  )

  return (
    <div className="date-range-picker flex space-x-4">
      <label htmlFor={startInputId} className="flex flex-col">
        <span className="text-sm font-medium">Start Date</span>
        <input
          id={startInputId}
          type="date"
          value={formattedStart}
          max={formattedEnd}
          onChange={handleStartChange}
          className="mt-1 border rounded px-2 py-1"
        />
      </label>
      <label htmlFor={endInputId} className="flex flex-col">
        <span className="text-sm font-medium">End Date</span>
        <input
          id={endInputId}
          type="date"
          value={formattedEnd}
          min={formattedStart}
          onChange={handleEndChange}
          className="mt-1 border rounded px-2 py-1"
        />
      </label>
    </div>
  )
}

export default DateRangePicker