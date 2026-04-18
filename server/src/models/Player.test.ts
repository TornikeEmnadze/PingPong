import { Player } from "../models/Player";
import { GAME_CONFIG } from "../../../client/shared/types/events";

describe("Player", () => {
  let player: Player;

  beforeEach(() => {
    player = new Player("player1", "left");
  });

  describe("initialization", () => {
    it("should initialize with correct id and side", () => {
      expect(player.id).toBe("player1");
      expect(player.side).toBe("left");
    });

    it("should start at center vertically", () => {
      const expectedY =
        GAME_CONFIG.CANVAS_HEIGHT / 2 - GAME_CONFIG.PADDLE_HEIGHT / 2;
      expect(player.paddleY).toBe(expectedY);
    });

    it("should have zero score initially", () => {
      expect(player.score).toBe(0);
    });

    it("should not be moving initially", () => {
      expect(player.isMoving).toBe(false);
      expect(player.moveDirection).toBe(null);
    });
  });

  describe("startMoving", () => {
    it("should set isMoving to true", () => {
      player.startMoving("up");
      expect(player.isMoving).toBe(true);
    });

    it("should set moveDirection correctly", () => {
      player.startMoving("down");
      expect(player.moveDirection).toBe("down");
    });

    it("should handle up direction", () => {
      player.startMoving("up");
      expect(player.moveDirection).toBe("up");
    });
  });

  describe("stopMoving", () => {
    it("should set isMoving to false", () => {
      player.startMoving("up");
      player.stopMoving();
      expect(player.isMoving).toBe(false);
    });

    it("should clear moveDirection", () => {
      player.startMoving("up");
      player.stopMoving();
      expect(player.moveDirection).toBe(null);
    });
  });

  describe("updatePaddle", () => {
    it("should not move paddle when not moving", () => {
      const initialY = player.paddleY;
      player.updatePaddle();
      expect(player.paddleY).toBe(initialY);
    });

    it("should move paddle up", () => {
      player.startMoving("up");
      const initialY = player.paddleY;
      player.updatePaddle();
      expect(player.paddleY).toBe(initialY - GAME_CONFIG.PADDLE_SPEED);
    });

    it("should move paddle down", () => {
      player.startMoving("down");
      const initialY = player.paddleY;
      player.updatePaddle();
      expect(player.paddleY).toBe(initialY + GAME_CONFIG.PADDLE_SPEED);
    });

    it("should prevent paddle from moving above top boundary", () => {
      player.paddleY = 2;
      player.startMoving("up");
      player.updatePaddle();
      expect(player.paddleY).toBeGreaterThanOrEqual(0);
    });

    it("should prevent paddle from moving below bottom boundary", () => {
      player.paddleY =
        GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PADDLE_HEIGHT - 2;
      player.startMoving("down");
      player.updatePaddle();
      expect(player.paddleY).toBeLessThanOrEqual(
        GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PADDLE_HEIGHT,
      );
    });
  });

  describe("getPaddleX", () => {
    it("should return 0 for left player", () => {
      const leftPlayer = new Player("left1", "left");
      expect(leftPlayer.getPaddleX()).toBe(0);
    });

    it("should return canvas width - paddle width for right player", () => {
      const rightPlayer = new Player("right1", "right");
      expect(rightPlayer.getPaddleX()).toBe(
        GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PADDLE_WIDTH,
      );
    });
  });

  describe("toPlayerData", () => {
    it("should return serializable player data", () => {
      player.score = 3;
      player.paddleY = 150;

      const playerData = player.toPlayerData();

      expect(playerData).toEqual({
        id: "player1",
        paddleY: 150,
        score: 3,
        side: "left",
      });
    });

    it("should not include movement state in serialization", () => {
      player.startMoving("up");
      const playerData = player.toPlayerData();

      expect(playerData).not.toHaveProperty("isMoving");
      expect(playerData).not.toHaveProperty("moveDirection");
    });
  });
});
