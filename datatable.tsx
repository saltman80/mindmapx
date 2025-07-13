export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  rowKey,
}: DataTableProps<T>): JSX.Element {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [filters, setFilters] = useState<Filter[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(defaultPageSize)

  const handleSort = useCallback(
    (columnKey: keyof T) => {
      if (sortKey === columnKey) {
        if (sortDirection === 'asc') {
          setSortDirection('desc')
        } else if (sortDirection === 'desc') {
          setSortKey(null)
          setSortDirection(null)
        } else {
          setSortDirection('asc')
        }
      } else {
        setSortKey(columnKey)
        setSortDirection('asc')
      }
      setCurrentPage(1)
    },
    [sortKey, sortDirection]
  )

  const handleFilter = useCallback((columnKey: string, value: string) => {
    setFilters(prev => {
      const others = prev.filter(f => f.columnKey !== columnKey)
      if (value) {
        return [...others, { columnKey, value }]
      }
      return others
    })
    setCurrentPage(1)
  }, [])

  const debouncedHandleFilter = useMemo(
    () => debounce(handleFilter, 300),
    [handleFilter]
  )

  useEffect(() => {
    return () => {
      debouncedHandleFilter.cancel()
    }
  }, [debouncedHandleFilter])

  const processedData = useMemo(() => {
    let filtered = data
    if (filters.length) {
      filters.forEach(({ columnKey, value }) => {
        filtered = filtered.filter(row => {
          const cell = row[columnKey as keyof T]
          return cell != null
            ? String(cell).toLowerCase().includes(value.toLowerCase())
            : false
        })
      })
    }
    if (sortKey && sortDirection) {
      const dir = sortDirection === 'asc' ? 1 : -1
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * dir
        }
        return String(aVal)
          .localeCompare(String(bVal), undefined, { numeric: true }) * dir
      })
    }
    return filtered
  }, [data, filters, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize))

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedData.slice(start, start + pageSize)
  }, [processedData, currentPage, pageSize])

  const getFilterValue = (key: string) => {
    const f = filters.find(f => f.columnKey === key)
    return f ? f.value : ''
  }

  const deriveRowKey = (row: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(row)
    }
    if (rowKey && typeof rowKey === 'string' && row[rowKey] != null) {
      return row[rowKey]
    }
    return index
  }

  const handlePageChange = (page: number) => {
    if (page < 1) page = 1
    if (page > totalPages) page = totalPages
    setCurrentPage(page)
  }

  const handlePageSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value))
    setCurrentPage(1)
  }

  return (
    <div className="datatable-container" style={{ overflowX: 'auto' }}>
      <table
        className="datatable-table"
        style={{ width: '100%', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={String(col.key)}
                scope="col"
                style={{
                  width: col.width,
                  padding: '8px',
                  borderBottom: '1px solid #ccc',
                  textAlign: 'left',
                }}
                aria-sort={
                  sortKey === col.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>{col.header}</span>
                  {col.sortable && (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {sortKey === col.key
                        ? sortDirection === 'asc'
                          ? '?'
                          : '?'
                        : '?'}
                    </button>
                  )}
                </div>
                {col.filterable && (
                  <input
                    type="text"
                    aria-label={`Filter ${col.header}`}
                    value={getFilterValue(String(col.key))}
                    onChange={e =>
                      debouncedHandleFilter(String(col.key), e.target.value)
                    }
                    placeholder={`Filter ${col.header}`}
                    style={{ marginTop: '4px', width: '100%' }}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr
              key={String(deriveRowKey(row, rowIndex))}
              style={{ borderBottom: '1px solid #eee' }}
            >
              {columns.map(col => (
                <td
                  key={String(col.key)}
                  style={{ padding: '8px' }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {paginatedData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: '8px', textAlign: 'center' }}
              >
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div
        className="datatable-footer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1rem',
        }}
      >
        <div className="pagination-info">
          Page {currentPage} of {totalPages}
        </div>
        <div
          className="pagination-controls"
          style={{ display: 'flex', gap: '8px' }}
        >
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
        <div className="page-size-select">
          <label>
            Show{' '}
            <select value={pageSize} onChange={handlePageSizeChange}>
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>{' '}
            entries
          </label>
        </div>
      </div>
    </div>
  )
}