import { PlayerData, GAME_CONFIG } from "../../../client/shared/types/events";

export class Player implements PlayerData {
  public id: string;
  public paddleY: number;
  public score: number;
  public side: "left" | "right";
  public isMoving: boolean = false;
  public moveDirection: "up" | "down" | null = null;

  constructor(id: string, side: "left" | "right") {
    this.id = id;
    this.side = side;
    this.paddleY =
      GAME_CONFIG.CANVAS_HEIGHT / 2 - GAME_CONFIG.PADDLE_HEIGHT / 2;
    this.score = 0;
  }

  updatePaddle(): void {
    if (!this.isMoving || !this.moveDirection) return;

    const direction = this.moveDirection === "up" ? -1 : 1;
    const newY = this.paddleY + direction * GAME_CONFIG.PADDLE_SPEED;

    // Keep paddle within bounds
    this.paddleY = Math.max(
      0,
      Math.min(newY, GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PADDLE_HEIGHT)
    );
  }

  startMoving(direction: "up" | "down"): void {
    this.isMoving = true;
    this.moveDirection = direction;
  }

  stopMoving(): void {
    this.isMoving = false;
    this.moveDirection = null;
  }

  getPaddleX(): number {
    return this.side === "left"
      ? 0
      : GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PADDLE_WIDTH;
  }

  // Method to get serializable data for network transmission
  toPlayerData(): PlayerData {
    return {
      id: this.id,
      paddleY: this.paddleY,
      score: this.score,
      side: this.side,
    };
  }
}
