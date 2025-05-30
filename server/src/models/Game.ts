import {
  GameState,
  GAME_CONFIG,
  PlayerData,
} from "../../../client/shared/types/events";
import { Player } from "./Player";
import { Ball } from "./Ball";

export class Game {
  public players: Map<string, Player> = new Map();
  public ball: Ball;
  public gameStatus: "waiting" | "playing" | "finished" = "waiting";
  public winner?: string;
  private gameLoop?: NodeJS.Timeout;

  constructor() {
    this.ball = new Ball();
  }

  addPlayer(playerId: string): Player | null {
    if (this.players.size >= 2) return null;

    const side = this.players.size === 0 ? "left" : "right";
    const player = new Player(playerId, side);
    this.players.set(playerId, player);

    if (this.players.size === 2) {
      this.startGame();
    }

    return player;
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    if (this.players.size < 2 && this.gameStatus === "playing") {
      this.stopGame();
    }
  }

  startGame(): void {
    this.gameStatus = "playing";
    this.ball.reset();

    this.gameLoop = setInterval(() => {
      this.updateGame();
    }, 1000 / 60); // 60 FPS
  }

  stopGame(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = undefined;
    }
    this.gameStatus = "waiting";
  }

  private updateGame(): void {
    // Update player paddles
    this.players.forEach((player) => player.updatePaddle());

    // Update ball
    this.ball.update();

    // Check paddle collisions
    this.players.forEach((player) => {
      if (
        this.ball.checkPaddleCollision(
          player.getPaddleX(),
          player.paddleY,
          GAME_CONFIG.PADDLE_WIDTH,
          GAME_CONFIG.PADDLE_HEIGHT
        )
      ) {
        this.ball.reverseX();
      }
    });

    // Check scoring
    this.checkScoring();
  }

  private checkScoring(): void {
    if (this.ball.state.position.x < 0) {
      // Right player scores
      const rightPlayer = Array.from(this.players.values()).find(
        (p) => p.side === "right"
      );
      if (rightPlayer) {
        rightPlayer.score++;
        this.checkWinCondition(rightPlayer);
      }
      this.ball.reset();
    } else if (this.ball.state.position.x > GAME_CONFIG.CANVAS_WIDTH) {
      // Left player scores
      const leftPlayer = Array.from(this.players.values()).find(
        (p) => p.side === "left"
      );
      if (leftPlayer) {
        leftPlayer.score++;
        this.checkWinCondition(leftPlayer);
      }
      this.ball.reset();
    }
  }

  private checkWinCondition(player: Player): void {
    if (player.score >= GAME_CONFIG.WINNING_SCORE) {
      this.gameStatus = "finished";
      this.winner = player.id;
      this.stopGame();
    }
  }

  getGameState(): GameState {
    const playersObj: { [key: string]: PlayerData } = {};
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
