const MindmapCanvas: React.FC<MindmapCanvasProps> = ({
  nodes,
  edges = [],
  onNodeDrag,
  onCreateNode,
  onNodeSelect,
  initialScale = 1,
  minScale = 0.2,
  maxScale = 4,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const [scale, setScale] = useState(initialScale);
  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const isPanning = useRef(false);
  const isDragging = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const dragNodeStartPos = useRef({ x: 0, y: 0 });
  const dragNodeId = useRef<string | null>(null);

  const frameRequested = useRef(false);
  const lastEvent = useRef<PointerEvent | null>(null);

  const pointerMoveHandlerRef = useRef<(e: PointerEvent) => void>(() => {});
  const pointerUpHandlerRef = useRef<() => void>(() => {});

  const pointerMoveListener = useRef<(e: PointerEvent) => void>((e) => {
    pointerMoveHandlerRef.current(e);
  });
  const pointerUpListener = useRef<(e: PointerEvent) => void>(() => {
    pointerUpHandlerRef.current();
  });
  const pointerCancelListener = useRef<(e: PointerEvent) => void>(() => {
    pointerUpHandlerRef.current();
  });

  pointerMoveHandlerRef.current = (event: PointerEvent) => {
    lastEvent.current = event;
    if (!frameRequested.current) {
      frameRequested.current = true;
      requestAnimationFrame(() => {
        const e = lastEvent.current!;
        if (isPanning.current) {
          const newX = e.clientX - panStart.current.x;
          const newY = e.clientY - panStart.current.y;
          setPan({ x: newX, y: newY });
        } else if (isDragging.current && dragNodeId.current) {
          const dx = (e.clientX - dragStart.current.x) / scaleRef.current;
          const dy = (e.clientY - dragStart.current.y) / scaleRef.current;
          const newX = dragNodeStartPos.current.x + dx;
          const newY = dragNodeStartPos.current.y + dy;
          onNodeDrag(dragNodeId.current, newX, newY);
        }
        frameRequested.current = false;
      });
    }
  };

  pointerUpHandlerRef.current = () => {
    isPanning.current = false;
    isDragging.current = false;
    dragNodeId.current = null;
    window.removeEventListener('pointermove', pointerMoveListener.current);
    window.removeEventListener('pointerup', pointerUpListener.current);
    window.removeEventListener('pointercancel', pointerCancelListener.current);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', pointerMoveListener.current);
      window.removeEventListener('pointerup', pointerUpListener.current);
      window.removeEventListener('pointercancel', pointerCancelListener.current);
    };
  }, []);

  const handleContainerPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    isPanning.current = true;
    panStart.current = {
      x: event.clientX - panRef.current.x,
      y: event.clientY - panRef.current.y,
    };
    window.addEventListener('pointermove', pointerMoveListener.current);
    window.addEventListener('pointerup', pointerUpListener.current);
    window.addEventListener('pointercancel', pointerCancelListener.current);
  }, []);

  const handleNodePointerDown = useCallback((id: string, x: number, y: number) => {
    return (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      event.preventDefault();
      isDragging.current = true;
      dragStart.current = { x: event.clientX, y: event.clientY };
      dragNodeId.current = id;
      dragNodeStartPos.current = { x, y };
      window.addEventListener('pointermove', pointerMoveListener.current);
      window.addEventListener('pointerup', pointerUpListener.current);
      window.addEventListener('pointercancel', pointerCancelListener.current);
    };
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const prevScale = scaleRef.current;
    const delta = -event.deltaY * 0.001;
    let newScale = prevScale * (1 + delta);
    newScale = Math.max(minScale, Math.min(maxScale, newScale));
    const worldX = (offsetX - panRef.current.x) / prevScale;
    const worldY = (offsetY - panRef.current.y) / prevScale;
    const newPanX = offsetX - worldX * newScale;
    const newPanY = offsetY - worldY * newScale;
    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  }, [minScale, maxScale]);

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - panRef.current.x) / scaleRef.current;
    const y = (event.clientY - rect.top - panRef.current.y) / scaleRef.current;
    onCreateNode(x, y);
  }, [onCreateNode]);

  const nodesMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach(n => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  }, [nodes]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={handleContainerPointerDown}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {edges.map(edge => {
            const source = nodesMap.get(edge.source);
            const target = nodesMap.get(edge.target);
            if (!source || !target) return null;
            return (
              <line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#000"
                strokeWidth={1}
              />
            );
          })}
        </svg>
        {nodes.map(node => (
          <div
            key={node.id}
            style={{ position: 'absolute', left: node.x, top: node.y, cursor: 'move' }}
            onPointerDown={handleNodePointerDown(node.id, node.x, node.y)}
            onDoubleClick={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation();
              onNodeSelect?.(node.id);
            }}
          >
            {node.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MindmapCanvas;