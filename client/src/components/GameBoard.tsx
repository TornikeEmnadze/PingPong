import React, { useEffect, useRef, useState } from "react";
import { GameState, GAME_CONFIG } from "../../shared/types/events";

interface GameBoardProps {
  gameState: GameState;
  playerId: string | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, playerId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Draw background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = "#fff";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(GAME_CONFIG.CANVAS_WIDTH / 2, 0);
    ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT);
    ctx.stroke();

    // Draw paddles
    ctx.fillStyle = "#fff";
    Object.values(gameState.players).forEach((player) => {
      const paddleX =
        player.side === "left"
          ? 0
          : GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PADDLE_WIDTH;
      ctx.fillRect(
        paddleX,
        player.paddleY,
        GAME_CONFIG.PADDLE_WIDTH,
        GAME_CONFIG.PADDLE_HEIGHT
      );
    });

    // Draw ball
    ctx.fillRect(
      gameState.ball.position.x,
      gameState.ball.position.y,
      GAME_CONFIG.BALL_SIZE,
      GAME_CONFIG.BALL_SIZE
    );
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONFIG.CANVAS_WIDTH}
      height={GAME_CONFIG.CANVAS_HEIGHT}
      style={{ border: "2px solid #fff", backgroundColor: "#000" }}
    />
  );
};

export default GameBoard;
