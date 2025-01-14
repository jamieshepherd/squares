import type { Container } from 'pixi.js'

export interface Chunk {
    container: Container
    x: number
    y: number
}

export interface ChunkCoords {
    x: number
    y: number
}

export interface ViewportBounds {
    left: number
    right: number
    top: number
    bottom: number
}
