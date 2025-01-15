import type { Application, Container, FederatedPointerEvent } from 'pixi.js'
import type { ChunkManager } from './ChunkManager'

export class GridNavigation {
    private isDragging = false
    private lastPosition = { x: 0, y: 0 }

    constructor(
        private container: Container,
        private chunkManager: ChunkManager,
        private app: Application,
    ) {
        this.setupDragHandling()
    }

    private setupDragHandling() {
        this.container.eventMode = 'static'

        const onDragStart = (event: FederatedPointerEvent) => {
            this.isDragging = true
            this.lastPosition = { x: event.globalX, y: event.globalY }
        }

        const onDragMove = (event: FederatedPointerEvent) => {
            if (!this.isDragging) return

            const dx = event.globalX - this.lastPosition.x
            const dy = event.globalY - this.lastPosition.y

            this.container.x += dx
            this.container.y += dy

            this.lastPosition = { x: event.globalX, y: event.globalY }
        }

        const onDragEnd = () => {
            this.isDragging = false
            this.chunkManager.updateVisibleChunks(this.app, this.container)
        }

        this.container.on('pointerdown', onDragStart)
        this.container.on('pointermove', onDragMove)
        this.container.on('pointerup', onDragEnd)
        this.container.on('pointerupoutside', onDragEnd)
    }

    cleanup() {
        this.container.off('pointerdown')
        this.container.off('pointermove')
        this.container.off('pointerup')
        this.container.off('pointerupoutside')
    }
}
