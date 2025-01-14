import { Application, Container, Text } from 'pixi.js'
import { useCallback, useEffect, useRef } from 'react'
import { ChunkManager } from './ChunkManager'
import { GridControls } from './GridControls'

function Grid() {
    const pixiContainer = useRef<HTMLDivElement>(null)
    const app = useRef<Application | undefined>(undefined)
    const mainContainer = useRef<Container>(new Container())
    const chunkManager = useRef<ChunkManager | undefined>(undefined)
    const gridControls = useRef<GridControls | undefined>(undefined)
    const fpsText = useRef<Text | undefined>(undefined)

    const getViewportBounds = useCallback(() => {
        if (!app.current || !mainContainer.current) {
            throw new Error('App not initialized')
        }

        return {
            left: -mainContainer.current.position.x,
            right: -mainContainer.current.position.x + app.current.screen.width,
            top: -mainContainer.current.position.y,
            bottom:
                -mainContainer.current.position.y + app.current.screen.height,
        }
    }, [])

    // Function to clean up Pixi application
    const cleanup = useCallback(() => {
        if (app.current) {
            gridControls.current?.cleanup()
            chunkManager.current?.cleanup()

            // Clean up containers
            mainContainer.current.destroy()
            mainContainer.current = new Container()

            // Clean up app
            app.current.stage.removeChildren()
            app.current.canvas.remove()
            app.current.destroy(true, { children: true })
            app.current = undefined
        }

        // Clean up any orphaned canvases
        if (pixiContainer.current) {
            const canvases =
                pixiContainer.current.getElementsByTagName('canvas')
            for (let i = canvases.length - 1; i >= 0; i--) {
                canvases[i].remove()
            }
        }
    }, [])

    useEffect(() => {
        let mounted = true

        const initPixi = async () => {
            if (!pixiContainer.current || !mounted) return

            cleanup()

            const newApp = new Application()
            await newApp.init({
                width: window.innerWidth,
                height: window.innerHeight,
                antialias: true,
                backgroundColor: 0xffffff,
                resolution: window.devicePixelRatio || 1,
            })

            if (!mounted) {
                newApp.destroy()
                return
            }

            app.current = newApp
            pixiContainer.current.appendChild(app.current.canvas)

            // Center the view on 0,0
            mainContainer.current.position.set(
                app.current.screen.width / 2,
                app.current.screen.height / 2,
            )

            app.current.stage.addChild(mainContainer.current)

            // Initialize managers
            chunkManager.current = new ChunkManager(mainContainer.current)
            gridControls.current = new GridControls(
                mainContainer.current,
                chunkManager.current,
                getViewportBounds,
            )

            // Add FPS counter
            fpsText.current = new Text('FPS: 0', {
                fill: 0x000000,
                fontSize: 16,
            })
            fpsText.current.position.set(10, 10)
            app.current.stage.addChild(fpsText.current)

            // Update FPS counter every 500ms
            let lastFpsUpdate = 0
            app.current.ticker.add(() => {
                if (fpsText.current && app.current) {
                    const now = Date.now()
                    if (now - lastFpsUpdate >= 500) {
                        fpsText.current.text = `FPS: ${Math.round(app.current.ticker.FPS)}`
                        lastFpsUpdate = now
                    }
                }
            })

            // Initial chunk update
            chunkManager.current.updateVisibleChunks(getViewportBounds())
        }

        initPixi()

        const handleResize = () => {
            if (app.current && chunkManager.current) {
                app.current.renderer.resize(
                    window.innerWidth,
                    window.innerHeight,
                )
                chunkManager.current.updateVisibleChunks(getViewportBounds())
            }
        }

        window.addEventListener('resize', handleResize)

        return () => {
            mounted = false
            window.removeEventListener('resize', handleResize)
            cleanup()
        }
    }, [cleanup, getViewportBounds])

    return (
        <div
            ref={pixiContainer}
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
