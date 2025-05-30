// Game Constants
export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 400,
  PADDLE_WIDTH: 10,
  PADDLE_HEIGHT: 80,
  BALL_SIZE: 10,
  PADDLE_SPEED: 5,
  BALL_SPEED: 3,
  WINNING_SCORE: 5,
} as const;

// Player position
export interface Position {
  x: number;
  y: number;
}

// Ball state
export interface BallState {
  position: Position;
  velocity: {
    x: number;
    y: number;
  };
}

// Player information (for network transmission)
export interface PlayerData {
  id: string;
  paddleY: number;
  score: number;
  side: "left" | "right";
}

// Complete game state
export interface GameState {
  players: { [key: string]: PlayerData };
  ball: BallState;
  gameStatus: "waiting" | "playing" | "finished";
  winner?: string;
}

// Socket Events
export interface ServerToClientEvents {
  gameStateUpdate: (gameState: GameState) => void;
  playerJoined: (player: PlayerData) => void;
  playerLeft: (playerId: string) => void;
  gameStart: () => void;
  gameEnd: (winner: string) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  joinGame: () => void;
  paddleMove: (direction: "up" | "down") => void;
  paddleStop: () => void;
}
