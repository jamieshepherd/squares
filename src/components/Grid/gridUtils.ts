import { Application, Container } from "pixi.js"

export function getViewportBounds(app: Application, container: Container) {
    if (!app || !container) {
        return {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        }
    }

    return {
        left: -container.position.x,
        right: -container.position.x + app.screen.width,
        top: -container.position.y, 
        bottom: -container.position.y + app.screen.height,
    }
}