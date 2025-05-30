import React, { useState, useEffect } from "react";
import { GameState, PlayerData } from "../shared/types/events";
import { useSocket } from "./hooks/useSocket";
import GameBoard from "./components/GameBoard";
import "./App.css";

const App: React.FC = () => {
  const socket = useSocket();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!socket) {
      console.log("Socket instance not yet available for event listeners.");
      return; // Don't set up listeners if socket is null
    }

    console.log("Setting up socket event listeners for socket ID:", socket.id);

    // Define socket event handlers
    const onConnect = () => {
      console.log("Socket connected! Socket ID:", socket.id);
      setIsConnected(true); // Update connection state
      setError(""); // Clear any previous errors on successful connection
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false); // Update connection state
      // Clear game and player state on disconnection for a clean slate
      setGameState(null);
      setCurrentPlayer(null);
      setError("Disconnected from server."); // Set a disconnection error message
    };

    const onGameStateUpdate = (state: GameState) => {
      setGameState(state); // Update game state
    };

    const onPlayerJoined = (player: PlayerData) => {
      console.log("Player joined:", player);
      setCurrentPlayer(player); // Set the current player info
    };

    const onPlayerLeft = (playerId: string) => {
      console.log(`Player left: ${playerId}`);
    };

    const onGameStart = () => {
      console.log("Game started!");
      setError(""); // Clear error if game starts
    };

    const onGameEnd = (winnerId: string) => {
      console.log(`Game ended! Winner: ${winnerId}`);
    };

    const onError = (message: string) => {
      console.error("Socket error:", message);
      setError(message); // Set error message in state
    };

    // Register listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("gameStateUpdate", onGameStateUpdate);
    socket.on("playerJoined", onPlayerJoined);
    socket.on("playerLeft", onPlayerLeft);
    socket.on("gameStart", onGameStart);
    socket.on("gameEnd", onGameEnd);
    socket.on("error", onError);

    return () => {
      console.log("Cleaning up socket listeners...");
      // Remove socket listeners using the same handlers
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("gameStateUpdate", onGameStateUpdate);
      socket.off("playerJoined", onPlayerJoined);
      socket.off("playerLeft", onPlayerLeft);
      socket.off("gameStart", onGameStart);
      socket.off("gameEnd", onGameEnd);
      socket.off("error", onError);
    };
  }, [socket]); // Dependency: Only re-run this effect when the socket instance changes

  useEffect(() => {
    if (!socket || !currentPlayer) {
      console.log(
        "Skipping keyboard listener setup: socket or currentPlayer not ready."
      );
      // Cleanup any existing listeners if conditions are no longer met
      return () => {
        console.log(
          "Cleaning up previous keyboard listeners (due to condition change)."
        );
      };
    }

    console.log(
      "Setting up keyboard listeners for player ID:",
      currentPlayer.id
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!currentPlayer) return;

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          event.preventDefault(); // Prevent default scroll behavior
          socket.emit("paddleMove", "up");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          event.preventDefault(); // Prevent default scroll behavior
          socket.emit("paddleMove", "down");
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!currentPlayer) return;

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
        case "ArrowDown":
        case "s":
        case "S":
          event.preventDefault(); // Prevent default scroll behavior
          socket.emit("paddleStop");
          break;
      }
    };

    // Add the event listeners to the window
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      console.log("Cleaning up keyboard listeners...");
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [socket, currentPlayer]);

  if (!isConnected) {
    return (
      <div className="app">
        <h1>Multiplayer Pong</h1>
        <p>Connecting to server...</p>
        {error && <p className="error">{error}</p>}{" "}
        {/* Show errors even while connecting */}
      </div>
    );
  }
  const joinGame = () => {
    if (socket && isConnected) {
      console.log("Attempting to join game...");
      socket.emit("joinGame");
      setError("");
    } else {
      console.warn("Socket not ready or not connected to join game.");
      setError("Not connected to server yet. Please wait."); // Inform user
    }
  };
  if (!currentPlayer) {
    return (
      <div className="app">
        <h1>Multiplayer Pong</h1>
        <button onClick={joinGame}>Join Game</button>
        {error && <p className="error">{error}</p>}{" "}
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Multiplayer Pong</h1>

      {/* Score Board: Display player scores */}
      {gameState && (
        <div className="score-board">
          <div className="scores">
            {Object.values(gameState.players || {}).map((player) => (
              <div
                key={player.id}
                className={`score ${
                  currentPlayer && player.id === currentPlayer.id
                    ? "current-player"
                    : ""
                }`}
              >
                <span>
                  Player {player.side}: {player.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="game-status">
        {gameState?.gameStatus === "waiting" && (
          <p>Waiting for another player...</p>
        )}
        {gameState?.gameStatus === "playing" && <p>Game in progress!</p>}
        {gameState?.gameStatus === "finished" && (
          <p>
            Game Over!{" "}
            {gameState.winner &&
            currentPlayer &&
            gameState.winner === currentPlayer.id
              ? "You win!"
              : "You lose!"}
          </p>
        )}

        {error && gameState?.gameStatus !== "finished" && (
          <p className="error">{error}</p>
        )}
      </div>

      {gameState && currentPlayer && (
        <GameBoard gameState={gameState} playerId={currentPlayer.id} />
      )}

      <div className="controls">
        <p>Controls: Use Arrow Keys or W/S to move your paddle</p>
        {currentPlayer && <p>You are the {currentPlayer.side} player</p>}
        {currentPlayer && <p>(Your ID: {currentPlayer.id})</p>}
      </div>
    </div>
  );
};

export default App;
