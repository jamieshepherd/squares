import { Toolbar } from '@/components/Toolbar/Toolbar'
import { useState } from 'react'
import Sidebar from '../Sidebar/Sidebar'
import VirtualGrid from '../VirtualGrid/VirtualGrid'
import styles from './App.module.css'

function App() {
    const [coordinate, setCoordinate] = useState({x: 0, y: 0})
    const [selected, setSelected] = useState(false)

    return (
        <div className={styles.wrapper}>
            <Toolbar coordinate={coordinate} setCoordinate={setCoordinate} />
            <VirtualGrid coordinate={coordinate} />
            <Sidebar selected={selected} setSelected={setSelected} />
        </div>
    )
}

export default App
