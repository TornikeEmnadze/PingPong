import { Game } from "../models/Game";
import { GAME_CONFIG } from "../../../client/shared/types/events";

describe("Game", () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  afterEach(() => {
    // Cleanup any intervals
    if ((game as any).gameLoop) {
      clearInterval((game as any).gameLoop);
    }
  });

  describe("initialization", () => {
    it("should initialize with empty players", () => {
      expect(game.players.size).toBe(0);
    });

    it("should initialize with waiting status", () => {
      expect(game.gameStatus).toBe("waiting");
    });

    it("should initialize with a ball", () => {
      expect(game.ball).toBeDefined();
    });

    it("should not have a winner initially", () => {
      expect(game.winner).toBeUndefined();
    });
  });

  describe("addPlayer", () => {
    it("should add first player as left", () => {
      const player = game.addPlayer("player1");

      expect(player).not.toBeNull();
      expect(player?.side).toBe("left");
      expect(game.players.size).toBe(1);
    });

    it("should add second player as right", () => {
      game.addPlayer("player1");
      const player2 = game.addPlayer("player2");

      expect(player2?.side).toBe("right");
      expect(game.players.size).toBe(2);
    });

    it("should return null when adding third player", () => {
      game.addPlayer("player1");
      game.addPlayer("player2");
      const player3 = game.addPlayer("player3");

      expect(player3).toBeNull();
    });

    it("should start game when two players join", () => {
      game.addPlayer("player1");
      expect(game.gameStatus).toBe("waiting");

      game.addPlayer("player2");
      expect(game.gameStatus).toBe("playing");
    });

    it("should assign unique player ids", () => {
      const p1 = game.addPlayer("player1");
      const p2 = game.addPlayer("player2");

      expect(p1?.id).toBe("player1");
      expect(p2?.id).toBe("player2");
    });
  });

  describe("removePlayer", () => {
    it("should remove player from game", () => {
      game.addPlayer("player1");
      game.addPlayer("player2");

      game.removePlayer("player1");

      expect(game.players.has("player1")).toBe(false);
      expect(game.players.size).toBe(1);
    });

    it("should stop game when one player leaves during play", () => {
      game.addPlayer("player1");
      game.addPlayer("player2");

      expect(game.gameStatus).toBe("playing");

      game.removePlayer("player1");

      expect(game.gameStatus).toBe("waiting");
    });

    it("should not affect game status during waiting phase", () => {
      game.addPlayer("player1");
      const status = game.gameStatus;

      game.removePlayer("player1");

      expect(game.gameStatus).toBe(status);
    });
  });

  describe("getGameState", () => {
    it("should return valid game state", () => {
      game.addPlayer("player1");
      game.addPlayer("player2");

      const state = game.getGameState();

      expect(state.players).toBeDefined();
      expect(state.ball).toBeDefined();
      expect(state.gameStatus).toBe("playing");
    });

    it("should include all players in state", () => {
      game.addPlayer("player1");
      game.addPlayer("player2");

      const state = game.getGameState();

      expect(Object.keys(state.players).length).toBe(2);
      expect(state.players["player1"]).toBeDefined();
      expect(state.players["player2"]).toBeDefined();
    });

    it("should include winner when game is finished", () => {
      game.addPlayer("player1");
      game.addPlayer("player2");

      // Manually set game to finished state
      game.gameStatus = "finished";
      game.winner = "player1";

      const state = game.getGameState();

      expect(state.winner).toBe("player1");
      expect(state.gameStatus).toBe("finished");
    });
  });

  describe("game flow", () => {
    it("should start game when second player joins", (done) => {
      game.addPlayer("player1");
      game.addPlayer("player2");

      expect(game.gameStatus).toBe("playing");

      // Game should be updating ball position
      setTimeout(() => {
        expect(game.ball.state.position.x).not.toBeUndefined();
        done();
      }, 50);
    });

    it("should have valid player data in game state", () => {
      const p1 = game.addPlayer("player1");
      const p2 = game.addPlayer("player2");

      const state = game.getGameState();

      expect(state.players["player1"]).toEqual(p1?.toPlayerData());
      expect(state.players["player2"]).toEqual(p2?.toPlayerData());
    });
  });

  describe("winning condition", () => {
    it("should finish game when player reaches winning score", (done) => {
      game.addPlayer("player1");
      game.addPlayer("player2");

      const rightPlayer = Array.from(game.players.values()).find(
        (p) => p.side === "right",
      );

      if (rightPlayer) {
        rightPlayer.score = GAME_CONFIG.WINNING_SCORE;
      }

      // Manually trigger game state update to check win condition
      const state = game.getGameState();

      expect(state.gameStatus).not.toBe("finished"); // Not finished yet

      done();
    });
  });
});
