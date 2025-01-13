import { useDrag } from '@use-gesture/react'
import { useRef } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import styles from './Grid.module.css'

function SquareGrid() {
    const gridOuterRef = useRef<HTMLDivElement>(null)
    const draggableRef = useRef<HTMLDivElement>(null)

    const columnCount = 100
    const rowCount = 100
    const columnWidth = 50
    const rowHeight = 50

    const Cell = ({
        columnIndex,
        rowIndex,
        style,
    }: {
        columnIndex: number
        rowIndex: number
        style: React.CSSProperties
    }) => {
        return (
            <div className={styles.cell} style={style}>
                {`${rowIndex}, ${columnIndex}`}
            </div>
        )
    }

    useDrag(
        ({ delta: [dx, dy], down }) => {
            if (!gridOuterRef.current) return

            gridOuterRef.current.scrollLeft -= dx
            gridOuterRef.current.scrollTop -= dy
        },
        {
            target: draggableRef,
        },
    )

    return (
        <div className={styles.wrapper}>
            <AutoSizer>
                {({ width, height }) => (
                    <Grid
                        className={styles.grid}
                        outerRef={gridOuterRef}
                        columnCount={columnCount}
                        columnWidth={columnWidth}
                        height={height}
                        rowCount={rowCount}
                        rowHeight={rowHeight}
                        width={width}
                        overscanColumnCount={0}
                        overscanRowCount={0}
                        style={{
                            overflow: 'hidden',
                        }}
                    >
                        {Cell}
                    </Grid>
                )}
            </AutoSizer>
            <div ref={draggableRef} className={styles.draggable} />
        </div>
    )
}

export default SquareGrid
