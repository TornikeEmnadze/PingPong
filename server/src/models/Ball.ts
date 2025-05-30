import {
  BallState,
  Position,
  GAME_CONFIG,
} from "../../../client/shared/types/events";

export class Ball {
  public state!: BallState;

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      position: {
        x: GAME_CONFIG.CANVAS_WIDTH / 2,
        y: GAME_CONFIG.CANVAS_HEIGHT / 2,
      },
      velocity: {
        x:
          Math.random() > 0.5
            ? GAME_CONFIG.BALL_SPEED
            : -GAME_CONFIG.BALL_SPEED,
        y: (Math.random() * 2 - 1) * GAME_CONFIG.BALL_SPEED, // Random vertical direction
      },
    };
  }

  update(): void {
    this.state.position.x += this.state.velocity.x;
    this.state.position.y += this.state.velocity.y;

    // Bounce off top and bottom walls
    if (
      this.state.position.y <= 0 ||
      this.state.position.y >= GAME_CONFIG.CANVAS_HEIGHT
    ) {
      this.state.velocity.y *= -1; // Reverse vertical direction
    }
  }

  checkPaddleCollision(
    paddleX: number,
    paddleY: number,
    paddleWidth: number,
    paddleHeight: number
  ): boolean {
    const ballLeft = this.state.position.x;
    const ballRight = this.state.position.x + GAME_CONFIG.BALL_SIZE;
    const ballTop = this.state.position.y;
    const ballBottom = this.state.position.y + GAME_CONFIG.BALL_SIZE;

    const paddleLeft = paddleX;
    const paddleRight = paddleX + paddleWidth;
    const paddleTop = paddleY;
    const paddleBottom = paddleY + paddleHeight;

    return (
      ballLeft < paddleRight &&
      ballRight > paddleLeft &&
      ballTop < paddleBottom &&
      ballBottom > paddleTop
    );
  }

  reverseX(): void {
    this.state.velocity.x *= -1; // Reverse horizontal direction
  }
}
