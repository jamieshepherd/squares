import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { CHUNK_PIXEL_SIZE, CHUNK_SIZE, GRID_BACKGROUND, SQUARE_SIZE, ZERO_SQUARE_COLOR } from './grid.config'
import { getViewportBounds } from './gridUtils'
import type { Chunk, ChunkCoords } from './types'

export class ChunkManager {
    private chunks = new Map<string, Chunk>()
    private perfMetrics = {
        squareCreationTime: 0,
        textCreationTime: 0,
        chunkCreationTime: 0,
        totalChunksCreated: 0
    }
    private lastUpdateTime = 0
    private updateCount = 0
    private isUpdating = false
    private pendingUpdate: ReturnType<typeof setTimeout> | null = null
    private textureCache = new Map<string, Text>()
    private readonly textStyle: TextStyle

    constructor(private mainContainer: Container) {
        // Create a shared text style to improve batching
        this.textStyle = new TextStyle({
            fontSize: SQUARE_SIZE / 4,
            fill: 0x000000,
            fontFamily: 'Arial',
        })
    }

    private getChunkKey(x: number, y: number): string {
        return `${x},${y}`
    }

    private createSquare(col: number, row: number, isZeroSquare: boolean, chunkX: number, chunkY: number): Container {
        const startTime = performance.now()
        
        const squareContainer = new Container()
        
        const square = new Graphics()
            .rect(0, 0, SQUARE_SIZE, SQUARE_SIZE)
            .stroke({ width: 1, color: 0x000000 })
            .fill(isZeroSquare ? ZERO_SQUARE_COLOR : GRID_BACKGROUND)

        squareContainer.addChild(square)
        squareContainer.position.set(col * SQUARE_SIZE, row * SQUARE_SIZE)

        const squareTime = performance.now()
        
        // Calculate absolute coordinates for the square
        const absX = chunkX * CHUNK_SIZE + col
        const absY = chunkY * CHUNK_SIZE + row

        // Reuse text objects from cache
        const textKey = `${absX},${absY}`
        let text = this.textureCache.get(textKey)
        
        if (!text) {
            text = new Text({
                text: `${absX}\n${absY}`,
                style: this.textStyle
            })
            text.anchor.set(0.5)
            text.position.set(SQUARE_SIZE / 2, SQUARE_SIZE / 2)
            this.textureCache.set(textKey, text)
        }
        
        squareContainer.addChild(text)

        const endTime = performance.now()
        
        this.perfMetrics.squareCreationTime += squareTime - startTime
        this.perfMetrics.textCreationTime += endTime - squareTime

        return squareContainer
    }

    private createChunk(chunkX: number, chunkY: number): Container {
        const startTime = performance.now()
        
        const chunkContainer = new Container()
        
        // Create squares in a batch
        const squares: Container[] = []
        for (let row = 0; row < CHUNK_SIZE; row++) {
            for (let col = 0; col < CHUNK_SIZE; col++) {
                const isZeroSquare = chunkX === 0 && chunkY === 0 && row === 0 && col === 0
                const square = this.createSquare(col, row, isZeroSquare, chunkX, chunkY)
                squares.push(square)
            }
        }
        
        // Position the chunk container before adding children
        chunkContainer.position.set(
            chunkX * CHUNK_PIXEL_SIZE,
            chunkY * CHUNK_PIXEL_SIZE,
        )
        
        // Batch add all squares
        chunkContainer.addChild(...squares)
        
        // Enable texture caching after all children are added
        chunkContainer.cacheAsTexture(true)
        // chunkContainer.updateCacheTexture()

        const endTime = performance.now()
        this.perfMetrics.chunkCreationTime += endTime - startTime
        this.perfMetrics.totalChunksCreated++

        return chunkContainer
    }

    getChunkCoords(x: number, y: number): ChunkCoords {
        return {
            x: Math.floor(x / CHUNK_PIXEL_SIZE),
            y: Math.floor(y / CHUNK_PIXEL_SIZE),
        }
    }

    updateVisibleChunks(app: Application, container: Container) {
        // Debounce updates
        if (this.pendingUpdate) {
            clearTimeout(this.pendingUpdate)
        }
        
        if (this.isUpdating) {
            // Queue update for later if we're currently updating
            this.pendingUpdate = setTimeout(() => {
                this.updateVisibleChunks(app, container)
            }, 16)
            return
        }
        
        this.isUpdating = true
        
        const now = performance.now()
        const timeSinceLastUpdate = now - this.lastUpdateTime
        const currentUpdateId = ++this.updateCount
        
        console.log(`\nUpdate #${currentUpdateId} started. Time since last update: ${timeSinceLastUpdate}ms`)
        
        const updateStartTime = now
        this.lastUpdateTime = now
        
        const viewportBounds = getViewportBounds(app, container)
        
        // Convert viewport bounds to chunk coordinates
        const startChunk = {
            x: Math.floor(viewportBounds.left / CHUNK_PIXEL_SIZE) - 1,
            y: Math.floor(viewportBounds.top / CHUNK_PIXEL_SIZE) - 1
        }
        const endChunk = {
            x: Math.ceil(viewportBounds.right / CHUNK_PIXEL_SIZE) + 1,
            y: Math.ceil(viewportBounds.bottom / CHUNK_PIXEL_SIZE) + 1
        }

        // Track which chunks we need to add
        const chunksToAdd = new Set<string>()
        const chunksToKeep = new Set<string>()

        // Identify needed chunks
        for (let x = startChunk.x; x <= endChunk.x; x++) {
            for (let y = startChunk.y; y <= endChunk.y; y++) {
                const chunkKey = this.getChunkKey(x, y)
                if (this.chunks.has(chunkKey)) {
                    chunksToKeep.add(chunkKey)
                } else {
                    chunksToAdd.add(chunkKey)
                }
            }
        }

        const chunksToRemove = new Set<string>()
        // Remove chunks that are no longer visible
        for (const [key, chunk] of this.chunks) {
            if (!chunksToKeep.has(key)) {
                chunksToRemove.add(key)
                this.mainContainer.removeChild(chunk.container)
                chunk.container.destroy()
                this.chunks.delete(key)
            }
        }

        // Add only new chunks
        if (chunksToAdd.size > 0) {
            const beforeChunkCreation = performance.now()
            
            // Create all chunks first before adding to stage
            const newChunks = Array.from(chunksToAdd).map(chunkKey => {
                const [x, y] = chunkKey.split(',').map(Number)
                return {
                    key: chunkKey,
                    container: this.createChunk(x, y),
                    x,
                    y
                }
            })
            
            // Batch add all new chunks to stage
            this.mainContainer.addChild(...newChunks.map(chunk => chunk.container))
            
            // Update chunks map
            for (const chunk of newChunks) {
                this.chunks.set(chunk.key, { container: chunk.container, x: chunk.x, y: chunk.y })
            }

            const updateEndTime = performance.now()
            const totalUpdateTime = updateEndTime - updateStartTime
            
            console.log(`Update #${currentUpdateId} Performance Metrics:`)
            console.log(`Viewport bounds: ${JSON.stringify(viewportBounds)}`)
            console.log(`Chunks added: ${chunksToAdd.size}, removed: ${chunksToRemove.size}, kept: ${chunksToKeep.size}`)
            console.log(`Chunk creation time: ${updateEndTime - beforeChunkCreation}ms`)
            console.log(`Square creation avg: ${this.perfMetrics.squareCreationTime / (this.perfMetrics.totalChunksCreated * CHUNK_SIZE * CHUNK_SIZE)}ms`)
            console.log(`Text creation avg: ${this.perfMetrics.textCreationTime / (this.perfMetrics.totalChunksCreated * CHUNK_SIZE * CHUNK_SIZE)}ms`)
            console.log(`Total update time: ${totalUpdateTime}ms`)
            
            // Track frame timing
            requestAnimationFrame(() => {
                const frameEndTime = performance.now()
                console.log(`Update #${currentUpdateId} frame completed after: ${frameEndTime - updateStartTime}ms`)
                this.isUpdating = false
            })
        } else {
            this.isUpdating = false
        }
    }

    cleanup() {
        if (this.pendingUpdate) {
            clearTimeout(this.pendingUpdate)
        }
        
        for (const chunk of this.chunks.values()) {
            chunk.container.destroy()
        }
        this.chunks.clear()
        this.textureCache.clear()
        
        // Reset performance metrics
        this.perfMetrics = {
            squareCreationTime: 0,
            textCreationTime: 0,
            chunkCreationTime: 0,
            totalChunksCreated: 0
        }
        this.lastUpdateTime = 0
        this.updateCount = 0
        this.isUpdating = false
    }
}