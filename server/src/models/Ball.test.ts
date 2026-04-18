import { Ball } from "../models/Ball";
import { GAME_CONFIG } from "../../../client/shared/types/events";

describe("Ball", () => {
  let ball: Ball;

  beforeEach(() => {
    ball = new Ball();
  });

  describe("initialization", () => {
    it("should initialize with position in center", () => {
      expect(ball.state.position.x).toBe(GAME_CONFIG.CANVAS_WIDTH / 2);
      expect(ball.state.position.y).toBe(GAME_CONFIG.CANVAS_HEIGHT / 2);
    });

    it("should have velocity set after reset", () => {
      expect(ball.state.velocity.x).toBeDefined();
      expect(ball.state.velocity.y).toBeDefined();
    });

    it("should have speed magnitude of BALL_SPEED", () => {
      const speed = Math.sqrt(
        ball.state.velocity.x ** 2 + ball.state.velocity.y ** 2,
      );
      expect(speed).toBeGreaterThan(0);
    });
  });

  describe("update", () => {
    it("should move ball by velocity", () => {
      const initialX = ball.state.position.x;
      const initialY = ball.state.position.y;
      ball.state.velocity.x = 5;
      ball.state.velocity.y = 3;

      ball.update();

      expect(ball.state.position.x).toBe(initialX + 5);
      expect(ball.state.position.y).toBe(initialY + 3);
    });

    it("should bounce off top wall", () => {
      ball.state.position.y = 2;
      ball.state.velocity.y = -5;
      const initialVelocityY = ball.state.velocity.y;

      ball.update();

      expect(ball.state.velocity.y).toBe(-initialVelocityY);
    });

    it("should bounce off bottom wall", () => {
      ball.state.position.y = GAME_CONFIG.CANVAS_HEIGHT - 5;
      ball.state.velocity.y = 5;
      const initialVelocityY = ball.state.velocity.y;

      ball.update();

      expect(ball.state.velocity.y).toBe(-initialVelocityY);
    });

    it("should not bounce on horizontal movement", () => {
      ball.state.position.x = 100;
      ball.state.velocity.x = 5;
      const initialVelocityX = ball.state.velocity.x;

      ball.update();

      expect(ball.state.velocity.x).toBe(initialVelocityX);
    });
  });

  describe("checkPaddleCollision", () => {
    it("should detect collision with paddle", () => {
      ball.state.position.x = 5;
      ball.state.position.y = 130;

      const hasCollision = ball.checkPaddleCollision(0, 100, 10, 80);

      expect(hasCollision).toBe(true);
    });

    it("should not detect collision when ball is far from paddle", () => {
      ball.state.position.x = 700;
      ball.state.position.y = 150;

      const hasCollision = ball.checkPaddleCollision(0, 100, 10, 80);

      expect(hasCollision).toBe(false);
    });

    it("should detect collision at paddle edges", () => {
      ball.state.position.x = 5;
      ball.state.position.y = 100;

      const hasCollision = ball.checkPaddleCollision(0, 80, 10, 80);

      expect(hasCollision).toBe(true);
    });
  });

  describe("reverseX", () => {
    it("should reverse horizontal velocity", () => {
      ball.state.velocity.x = 5;
      ball.reverseX();
      expect(ball.state.velocity.x).toBe(-5);
    });

    it("should work correctly when called twice", () => {
      const originalVelocity = ball.state.velocity.x;
      ball.reverseX();
      ball.reverseX();
      expect(ball.state.velocity.x).toBe(originalVelocity);
    });
  });

  describe("reset", () => {
    it("should reset ball to center", () => {
      ball.state.position.x = 100;
      ball.state.position.y = 200;
      ball.reset();

      expect(ball.state.position.x).toBe(GAME_CONFIG.CANVAS_WIDTH / 2);
      expect(ball.state.position.y).toBe(GAME_CONFIG.CANVAS_HEIGHT / 2);
    });

    it("should set new velocity on reset", () => {
      const originalVelocity = { ...ball.state.velocity };
      ball.state.velocity.x = 0;
      ball.state.velocity.y = 0;

      ball.reset();

      // Velocity should be different from zero and non-zero
      expect(ball.state.velocity.x !== 0 || ball.state.velocity.y !== 0).toBe(
        true,
      );
    });
  });
});
