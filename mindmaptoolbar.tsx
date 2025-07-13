const PAN_STEP = 100
const ZOOM_FACTOR = 1.2

const MindmapToolbar: FC<MindmapToolbarProps> = ({
  onPan,
  onZoom,
  onAddNode,
  onToggleGrid,
  gridEnabled,
}) => {
  const handlePanUp = useCallback(() => onPan(0, -PAN_STEP), [onPan])
  const handlePanLeft = useCallback(() => onPan(-PAN_STEP, 0), [onPan])
  const handlePanRight = useCallback(() => onPan(PAN_STEP, 0), [onPan])
  const handlePanDown = useCallback(() => onPan(0, PAN_STEP), [onPan])

  const handleZoomIn = useCallback(() => onZoom(ZOOM_FACTOR), [onZoom])
  const handleZoomOut = useCallback(() => onZoom(1 / ZOOM_FACTOR), [onZoom])

  const handleAdd = useCallback(() => onAddNode(), [onAddNode])
  const handleToggleGrid = useCallback(() => onToggleGrid(), [onToggleGrid])

  return (
    <div
      className="mindmap-toolbar"
      style={{
        display: 'flex',
        gap: '8px',
        padding: '8px',
        background: '#fff',
        borderRadius: '4px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        alignItems: 'center',
      }}
    >
      <button type="button" onClick={handlePanUp} aria-label="Pan Up">?</button>
      <button type="button" onClick={handlePanLeft} aria-label="Pan Left">?</button>
      <button type="button" onClick={handlePanRight} aria-label="Pan Right">?</button>
      <button type="button" onClick={handlePanDown} aria-label="Pan Down">?</button>
      <button type="button" onClick={handleZoomIn} aria-label="Zoom In">?</button>
      <button type="button" onClick={handleZoomOut} aria-label="Zoom Out">?</button>
      <button type="button" onClick={handleAdd} aria-label="Add Node">?</button>
      <button type="button" onClick={handleToggleGrid} aria-label="Toggle Grid">
        {gridEnabled ? 'Hide Grid' : 'Show Grid'}
      </button>
    </div>
  )
}

export default MindmapToolbar