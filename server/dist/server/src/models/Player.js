"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const events_1 = require("../../../client/shared/types/events");
class Player {
    constructor(id, side) {
        this.isMoving = false;
        this.moveDirection = null;
        this.id = id;
        this.side = side;
        this.paddleY =
            events_1.GAME_CONFIG.CANVAS_HEIGHT / 2 - events_1.GAME_CONFIG.PADDLE_HEIGHT / 2;
        this.score = 0;
    }
    updatePaddle() {
        if (!this.isMoving || !this.moveDirection)
            return;
        const direction = this.moveDirection === "up" ? -1 : 1;
        const newY = this.paddleY + direction * events_1.GAME_CONFIG.PADDLE_SPEED;
        // Keep paddle within bounds
        this.paddleY = Math.max(0, Math.min(newY, events_1.GAME_CONFIG.CANVAS_HEIGHT - events_1.GAME_CONFIG.PADDLE_HEIGHT));
    }
    startMoving(direction) {
        this.isMoving = true;
        this.moveDirection = direction;
    }
    stopMoving() {
        this.isMoving = false;
        this.moveDirection = null;
    }
    getPaddleX() {
        return this.side === "left"
            ? 0
            : events_1.GAME_CONFIG.CANVAS_WIDTH - events_1.GAME_CONFIG.PADDLE_WIDTH;
    }
    // Method to get serializable data for network transmission
    toPlayerData() {
        return {
            id: this.id,
            paddleY: this.paddleY,
            score: this.score,
            side: this.side,
        };
    }
}
exports.Player = Player;
