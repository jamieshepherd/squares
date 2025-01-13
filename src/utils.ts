export function coordToId(x: number, y: number) {
    return (y - 1) * 100 + x
}

export function idToCoord(id: number) {
    const y = Math.floor(id / 100) + 1
    const x = id - (y - 1) * 100
    return { x, y }
}
