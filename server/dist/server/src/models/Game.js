"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const events_1 = require("../../../client/shared/types/events");
const Player_1 = require("./Player");
const Ball_1 = require("./Ball");
class Game {
    constructor() {
        this.players = new Map();
        this.gameStatus = "waiting";
        this.ball = new Ball_1.Ball();
    }
    addPlayer(playerId) {
        if (this.players.size >= 2)
            return null;
        const side = this.players.size === 0 ? "left" : "right";
        const player = new Player_1.Player(playerId, side);
        this.players.set(playerId, player);
        if (this.players.size === 2) {
            this.startGame();
        }
        return player;
    }
    removePlayer(playerId) {
        this.players.delete(playerId);
        if (this.players.size < 2 && this.gameStatus === "playing") {
            this.stopGame();
        }
    }
    startGame() {
        this.gameStatus = "playing";
        this.ball.reset();
        this.gameLoop = setInterval(() => {
            this.updateGame();
        }, 1000 / 60); // 60 FPS
    }
    stopGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = undefined;
        }
        this.gameStatus = "waiting";
    }
    updateGame() {
        // Update player paddles
        this.players.forEach((player) => player.updatePaddle());
        // Update ball
        this.ball.update();
        // Check paddle collisions
        this.players.forEach((player) => {
            if (this.ball.checkPaddleCollision(player.getPaddleX(), player.paddleY, events_1.GAME_CONFIG.PADDLE_WIDTH, events_1.GAME_CONFIG.PADDLE_HEIGHT)) {
                this.ball.reverseX();
            }
        });
        // Check scoring
        this.checkScoring();
    }
    checkScoring() {
        if (this.ball.state.position.x < 0) {
            // Right player scores
            const rightPlayer = Array.from(this.players.values()).find((p) => p.side === "right");
            if (rightPlayer) {
                rightPlayer.score++;
                this.checkWinCondition(rightPlayer);
            }
            this.ball.reset();
        }
        else if (this.ball.state.position.x > events_1.GAME_CONFIG.CANVAS_WIDTH) {
            // Left player scores
            const leftPlayer = Array.from(this.players.values()).find((p) => p.side === "left");
            if (leftPlayer) {
                leftPlayer.score++;
                this.checkWinCondition(leftPlayer);
            }
            this.ball.reset();
        }
    }
    checkWinCondition(player) {
        if (player.score >= events_1.GAME_CONFIG.WINNING_SCORE) {
            this.gameStatus = "finished";
            this.winner = player.id;
            this.stopGame();
        }
    }
    getGameState() {
        const playersObj = {};
        this.players.forEach((player, id) => {
            playersObj[id] = player.toPlayerData();
        });
        return {
            players: playersObj,
            ball: this.ball.state,
            gameStatus: this.gameStatus,
            winner: this.winner,
        };
    }
}
exports.Game = Game;
