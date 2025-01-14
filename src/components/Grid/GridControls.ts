import type { Container, FederatedPointerEvent } from 'pixi.js'
import type { ChunkManager } from './ChunkManager'
import { CHUNK_UPDATE_THROTTLE } from './config'

export class GridControls {
    private isDragging = false
    private lastPosition = { x: 0, y: 0 }
    private lastUpdateTime = 0

    constructor(
        private container: Container,
        private chunkManager: ChunkManager,
        private getViewportBounds: () => {
            left: number
            right: number
            top: number
            bottom: number
        },
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

            // Throttle chunk updates during pan
            const now = Date.now()
            if (now - this.lastUpdateTime >= CHUNK_UPDATE_THROTTLE) {
                this.chunkManager.updateVisibleChunks(this.getViewportBounds())
                this.lastUpdateTime = now
            }
        }

        const onDragEnd = () => {
            this.isDragging = false
            // Final update after drag ends
            this.chunkManager.updateVisibleChunks(this.getViewportBounds())
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
