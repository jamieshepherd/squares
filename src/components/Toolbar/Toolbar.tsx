import { useState } from 'react'
import styles from './Toolbar.module.css'

export const Toolbar = ({coordinate, setCoordinate}: {coordinate: {x: number, y: number}, setCoordinate: (coordinate: {x: number, y: number}) => void}) => {
    const [x, setX] = useState(coordinate.x)
    const [y, setY] = useState(coordinate.y)
    
    return <div className={styles.toolbar}>
        <div className={styles.toolbarItem}>Squares</div>
        <div className={styles.toolbarItem}>
            <input type="number" value={x} onChange={(e) => setX(parseInt(e.target.value))} />
            <input type="number" value={y} onChange={(e) => setY(parseInt(e.target.value))} />
            <button onClick={() => setCoordinate({x: x, y: y})}>Go to</button>
        </div>
        <div className={styles.toolbarItem}>Nav</div>
    </div>
}
