import { Stats } from 'pixi-stats'
import { Application, Container } from 'pixi.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChunkManager } from './ChunkManager'
import { GridNavigation } from './GridNavigation'

function Grid() {
    const [app, setApp] = useState<Application | undefined>(undefined)
    const pixiCanvas = useRef<HTMLDivElement>(null)
    const pixiContainer = useRef<Container>(new Container())
    const chunkManager = useRef<ChunkManager | undefined>(undefined)
    const gridNavigation = useRef<GridNavigation | undefined>(undefined)

    const cleanup = useCallback(() => {
        if (app) {
            const navigation = gridNavigation.current
            const manager = chunkManager.current
            const container = pixiContainer.current

            navigation?.cleanup()
            manager?.cleanup()
            container.destroy()
            pixiContainer.current = new Container()
            app.destroy(true, { children: true })
            setApp(undefined) 
        }
    }, [])

    useEffect(() => {
        const initPixi = async () => {
            if (!pixiCanvas.current) return

            cleanup()

            const newApp = new Application()

            // remove div with #stats
            const statsDiv = document.querySelector('#stats')
            if (statsDiv) {
                statsDiv.remove()
            }
            
            // @ts-ignore
            new Stats(newApp.renderer);
            
            await newApp.init({
                width: window.innerWidth,
                height: window.innerHeight,
                antialias: true,
                backgroundColor: 0xffffff,
                resolution: window.devicePixelRatio || 1,
            })
            
            const container = pixiContainer.current
            
            // Remove any existing canvas elements
            if (pixiCanvas.current) {
                const canvases = pixiCanvas.current.getElementsByTagName('canvas')
                Array.from(canvases).forEach(canvas => canvas.remove())
            }
            pixiCanvas.current.appendChild(newApp.canvas)

            // Center the view on 0,0
            container.position.set(
                newApp.screen.width / 2,
                newApp.screen.height / 2,
            )

            newApp.stage.addChild(container)

            // Initialize managers
            const manager = new ChunkManager(container)
            const navigation = new GridNavigation(
                container,
                manager,
                newApp,
            )

            chunkManager.current = manager
            gridNavigation.current = navigation

            // Initial chunk update
            manager.updateVisibleChunks(newApp, container)

            setApp(newApp)
        }

        initPixi()

        return () => {
            cleanup()
        }
    }, [])

    return (
        <div
            ref={pixiCanvas}
            style={{
                width: '100vw',
                height: '100vh',
                margin: 0,
                overflow: 'hidden',
            }}
        />
    )
}

export default Grid
