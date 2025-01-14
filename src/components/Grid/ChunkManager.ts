import { Container, Graphics } from 'pixi.js'
import {
    CHUNK_PIXEL_SIZE,
    CHUNK_SIZE,
    GRID_BACKGROUND,
    HOVER_COLOR,
    SQUARE_SIZE,
    ZERO_SQUARE_COLOR,
} from './config'
import type { Chunk, ChunkCoords, ViewportBounds } from './types'

export class ChunkManager {
    private chunks = new Map<string, Chunk>()
    private sharedHoverGraphics: Graphics
    private currentHoverSquare: Graphics | null = null

    constructor(private mainContainer: Container) {
        // Create a shared graphics object for hover states
        this.sharedHoverGraphics = new Graphics()
            .rect(0, 0, SQUARE_SIZE, SQUARE_SIZE)
            .stroke({ width: 1, color: 0x000000 })
            .fill(HOVER_COLOR)
        this.sharedHoverGraphics.visible = false
        this.mainContainer.addChild(this.sharedHoverGraphics)
    }

    private getChunkKey(x: number, y: number): string {
        return `${x},${y}`
    }

    private createSquare(
        col: number,
        row: number,
        isZeroSquare: boolean,
    ): Graphics {
        const square = new Graphics()
            .rect(0, 0, SQUARE_SIZE, SQUARE_SIZE)
            .stroke({ width: 1, color: 0x000000 })
            .fill(isZeroSquare ? ZERO_SQUARE_COLOR : GRID_BACKGROUND)

        square.position.set(col * SQUARE_SIZE, row * SQUARE_SIZE)
        square.eventMode = 'static'

        if (!isZeroSquare) {
            square.on('pointerover', () => {
                if (this.currentHoverSquare) {
                    this.currentHoverSquare.visible = true
                }
                this.currentHoverSquare = square
                const worldPos = square.getGlobalPosition()
                this.sharedHoverGraphics.position.copyFrom(worldPos)
                this.sharedHoverGraphics.visible = true
                square.visible = false
            })

            square.on('pointerout', () => {
                if (this.currentHoverSquare === square) {
                    this.sharedHoverGraphics.visible = false
                    square.visible = true
                    this.currentHoverSquare = null
                }
            })
        }

        return square
    }

    private createChunk(chunkX: number, chunkY: number): Container {
        const chunkContainer = new Container()
        chunkContainer.position.set(
            chunkX * CHUNK_PIXEL_SIZE,
            chunkY * CHUNK_PIXEL_SIZE,
        )

        // Add debug outline
        const debugBounds = new Graphics()
            .rect(0, 0, CHUNK_PIXEL_SIZE, CHUNK_PIXEL_SIZE)
            .stroke({ width: 2, color: 0xff0000 })
        chunkContainer.addChild(debugBounds)

        // Create squares in a batch
        const squares: Graphics[] = []
        for (let row = 0; row < CHUNK_SIZE; row++) {
            for (let col = 0; col < CHUNK_SIZE; col++) {
                const isZeroSquare =
                    chunkX === 0 && chunkY === 0 && row === 0 && col === 0
                const square = this.createSquare(col, row, isZeroSquare)
                squares.push(square)
            }
        }
        chunkContainer.addChild(...squares)

        return chunkContainer
    }

    getChunkCoords(x: number, y: number): ChunkCoords {
        return {
            x: Math.floor(x / CHUNK_PIXEL_SIZE),
            y: Math.floor(y / CHUNK_PIXEL_SIZE),
        }
    }

    updateVisibleChunks(viewportBounds: ViewportBounds) {
        const startChunk = this.getChunkCoords(
            viewportBounds.left - CHUNK_PIXEL_SIZE,
            viewportBounds.top - CHUNK_PIXEL_SIZE,
        )
        const endChunk = this.getChunkCoords(
            viewportBounds.right + CHUNK_PIXEL_SIZE,
            viewportBounds.bottom + CHUNK_PIXEL_SIZE,
        )

        // Track which chunks we need to add
        const chunksToAdd = new Set<string>()
        const chunksToKeep = new Set<string>()

        // First pass: identify needed chunks
        for (let x = startChunk.x - 1; x <= endChunk.x + 1; x++) {
            for (let y = startChunk.y - 1; y <= endChunk.y + 1; y++) {
                const chunkKey = this.getChunkKey(x, y)
                if (this.chunks.has(chunkKey)) {
                    chunksToKeep.add(chunkKey)
                } else {
                    chunksToAdd.add(chunkKey)
                }
            }
        }

        // Remove chunks that are no longer visible
        for (const [key, chunk] of this.chunks) {
            if (!chunksToKeep.has(key)) {
                this.mainContainer.removeChild(chunk.container)
                chunk.container.destroy()
                this.chunks.delete(key)
            }
        }

        // Add only new chunks
        for (const chunkKey of chunksToAdd) {
            const [x, y] = chunkKey.split(',').map(Number)
            const chunkContainer = this.createChunk(x, y)
            this.mainContainer.addChild(chunkContainer)
            this.chunks.set(chunkKey, {
                container: chunkContainer,
                x,
                y,
            })
        }
    }

    cleanup() {
        for (const chunk of this.chunks.values()) {
            chunk.container.destroy()
        }
        this.chunks.clear()
        this.sharedHoverGraphics.destroy()
    }
}
