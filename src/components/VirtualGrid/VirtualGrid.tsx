import { useVirtualizer } from '@tanstack/react-virtual'
import React from 'react'
import styles from './VirtualGrid.module.css'

const WIDTH = 10000
const HEIGHT = 10000

function VirtualGrid({coordinate = {x: 0, y: 0}}: {coordinate: {x: number, y: number}  }) {
    const parentRef = React.useRef<HTMLDivElement>(null)

    const rowVirtualizer = useVirtualizer({
      count: HEIGHT,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 50,
      overscan: 5,
    })
  
    const columnVirtualizer = useVirtualizer({
      horizontal: true,
      count: WIDTH,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 50,
      overscan: 5,
    })

    const scrollToCoordinate = (x: number, y: number) => {
        if (!parentRef.current) return
        
        // Convert from coordinate space (-5000,5000) to grid space (0,10000)
        const gridX = x + (WIDTH / 2)
        const gridY = y + (HEIGHT / 2)
        
        // Multiply by cell size (50) to get pixel position
        const scrollX = (gridX * 50) - (parentRef.current.clientWidth / 2) + 25
        const scrollY = (gridY * 50) - (parentRef.current.clientHeight / 2) + 25
        
        parentRef.current.scrollTo({
            left: scrollX,
            top: scrollY,
        })
    }

    React.useEffect(() => {
        scrollToCoordinate(coordinate.x, coordinate.y)
    }, [coordinate])
  
    return (
      <>
        <div
          ref={parentRef}
          className={styles.wrapper}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: `${columnVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <React.Fragment key={virtualRow.key}>
                {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
                  <div
                    key={virtualColumn.key}
                    className={styles.square}
                    style={{
                      transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {virtualRow.index - (HEIGHT / 2)}, {virtualColumn.index - (WIDTH / 2)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </>
    )
}

export default VirtualGrid
