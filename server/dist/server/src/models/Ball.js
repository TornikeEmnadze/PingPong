"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ball = void 0;
const events_1 = require("../../../client/shared/types/events");
class Ball {
    constructor() {
        this.reset();
    }
    reset() {
        this.state = {
            position: {
                x: events_1.GAME_CONFIG.CANVAS_WIDTH / 2,
                y: events_1.GAME_CONFIG.CANVAS_HEIGHT / 2,
            },
            velocity: {
                x: Math.random() > 0.5
                    ? events_1.GAME_CONFIG.BALL_SPEED
                    : -events_1.GAME_CONFIG.BALL_SPEED,
                y: (Math.random() * 2 - 1) * events_1.GAME_CONFIG.BALL_SPEED, // Random vertical direction
            },
        };
    }
    update() {
        this.state.position.x += this.state.velocity.x;
        this.state.position.y += this.state.velocity.y;
        // Bounce off top and bottom walls
        if (this.state.position.y <= 0 ||
            this.state.position.y >= events_1.GAME_CONFIG.CANVAS_HEIGHT) {
            this.state.velocity.y *= -1; // Reverse vertical direction
        }
    }
    checkPaddleCollision(paddleX, paddleY, paddleWidth, paddleHeight) {
        const ballLeft = this.state.position.x;
        const ballRight = this.state.position.x + events_1.GAME_CONFIG.BALL_SIZE;
        const ballTop = this.state.position.y;
        const ballBottom = this.state.position.y + events_1.GAME_CONFIG.BALL_SIZE;
        const paddleLeft = paddleX;
        const paddleRight = paddleX + paddleWidth;
        const paddleTop = paddleY;
        const paddleBottom = paddleY + paddleHeight;
        return (ballLeft < paddleRight &&
            ballRight > paddleLeft &&
            ballTop < paddleBottom &&
            ballBottom > paddleTop);
    }
    reverseX() {
        this.state.velocity.x *= -1; // Reverse horizontal direction
    }
}
exports.Ball = Ball;
