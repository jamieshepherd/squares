import Grid from '@/components/Grid/Grid'
import { Toolbar } from '@/components/Toolbar/Toolbar'
import styles from './App.module.css'

function App() {
    return (
        <div className={styles.wrapper}>
            <Toolbar />
            <Grid />
        </div>
    )
}

export default App
