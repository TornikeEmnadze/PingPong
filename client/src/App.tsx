import React, { useState, useEffect } from "react";
// Corrected import: Using 'Player' as defined in your shared types
import { GameState, PlayerData } from "../shared/types/events";
import { useSocket } from "./hooks/useSocket";
import GameBoard from "./components/GameBoard";
import "./App.css";

const App: React.FC = () => {
  // useSocket hook provides the socket instance
  const socket = useSocket();
  // State for game data, current player info, connection status, and errors
  const [gameState, setGameState] = useState<GameState | null>(null);
  // Corrected state type: Using 'Player'
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>("");

  // --- Effect 1: Handle Socket Event Listeners ---
  // This effect sets up listeners for incoming socket messages from the server.
  // It runs only when the socket instance changes (i.e., when it becomes available after initial render).
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
      // console.log('Game state updated:', state); // Optional: log state updates (can be noisy)
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

    // --- Cleanup Function for Socket Listeners ---
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
      // Note: socket.disconnect() is handled in the useSocket hook itself.
    };
  }, [socket]); // Dependency: Only re-run this effect when the socket instance changes

  // --- Effect 2: Handle Window Keyboard Listeners ---
  // This effect sets up listeners for keyboard input to control the paddle.
  // It runs when the socket or currentPlayer changes.
  // This ensures the handlers have access to the LATEST currentPlayer value.
  useEffect(() => {
    // Only set up keyboard listeners if socket is available AND the current player is set
    if (!socket || !currentPlayer) {
      console.log(
        "Skipping keyboard listener setup: socket or currentPlayer not ready."
      );
      // Cleanup any existing listeners if conditions are no longer met
      return () => {
        console.log(
          "Cleaning up previous keyboard listeners (due to condition change)."
        );
        // We need a way to reference the specific handler instances that were added.
        // Let's define handlers inside the return if socket/currentPlayer *were* previously valid.
        // Or, define them outside and ensure they read the latest state (e.g. via useRef),
        // but using separate effect is often clearer here.
      };
    }

    console.log(
      "Setting up keyboard listeners for player ID:",
      currentPlayer.id
    );

    // Define keyboard event handlers - These handlers will correctly close over
    // the LATEST 'socket' and 'currentPlayer' values from this effect's run.
    const handleKeyDown = (event: KeyboardEvent) => {
      // The !currentPlayer check is technically redundant *if* this effect only runs when currentPlayer is set,
      // but leaving it doesn't hurt and adds robustness.
      if (!currentPlayer) return; // This check will now evaluate correctly

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
      if (!currentPlayer) return; // This check will now evaluate correctly

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

    // --- Cleanup Function for Keyboard Listeners ---
    // This runs when socket or currentPlayer changes, or component unmounts.
    return () => {
      console.log("Cleaning up keyboard listeners...");
      // Remove the specific handler instances that were added in this effect run
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };

    // Dependency: Re-run this effect and re-attach listeners when socket OR currentPlayer changes.
    // This ensures handlers get the latest socket/player state and are removed/added appropriately.
  }, [socket, currentPlayer]); // <-- Dependencies are crucial here

  // --- Rendering Logic ---
  // Render different UI states based on connection and player status

  // Show connecting status if socket is not yet connected (based on state updated by Effect 1)
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
    // Only attempt to join if the socket exists AND is currently connected
    if (socket && isConnected) {
      console.log("Attempting to join game...");
      socket.emit("joinGame"); // Emit the 'joinGame' event to the server
      setError(""); // Clear any previous error message when attempting to join
    } else {
      // Optionally handle case where socket isn't ready yet or not connected
      console.warn("Socket not ready or not connected to join game.");
      setError("Not connected to server yet. Please wait."); // Inform user
    }
  };
  // If connected but player hasn't joined/been assigned yet
  // The server sends 'playerJoined' after successful 'joinGame'
  if (!currentPlayer) {
    return (
      <div className="app">
        <h1>Multiplayer Pong</h1>
        <button onClick={joinGame}>Join Game</button>
        {error && <p className="error">{error}</p>}{" "}
        {/* Show errors related to joining (e.g., game full) */}
      </div>
    );
  }

  // If connected and player has joined, show the main game UI
  return (
    <div className="app">
      <h1>Multiplayer Pong</h1>

      {/* Score Board: Display player scores */}
      {gameState && (
        <div className="score-board">
          <div className="scores">
            {/* Iterate over players from the gameState */}
            {/* Use Optional Chaining for safety in case players object is null/undefined briefly */}
            {Object.values(gameState.players || {}).map((player) => (
              // Highlight the current player's score
              // Ensure currentPlayer is defined before comparing IDs
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

      {/* Game Status Messages: Waiting, Playing, Finished */}
      <div className="game-status">
        {gameState?.gameStatus === "waiting" && (
          <p>Waiting for another player...</p>
        )}
        {gameState?.gameStatus === "playing" && <p>Game in progress!</p>}
        {gameState?.gameStatus === "finished" && (
          // Display win/lose message
          // Ensure winner and currentPlayer are defined
          <p>
            Game Over!{" "}
            {gameState.winner &&
            currentPlayer &&
            gameState.winner === currentPlayer.id
              ? "You win!"
              : "You lose!"}
          </p>
        )}
        {/* Show general errors (e.g., disconnection during play), but not if game is finished */}
        {error && gameState?.gameStatus !== "finished" && (
          <p className="error">{error}</p>
        )}
      </div>

      {/* Game Board: Render the canvas */}
      {gameState &&
        // Ensure currentPlayer is defined before passing its id to GameBoard
        currentPlayer && (
          <GameBoard gameState={gameState} playerId={currentPlayer.id} />
        )}

      {/* Controls Information */}
      <div className="controls">
        <p>Controls: Use Arrow Keys or W/S to move your paddle</p>
        {/* Ensure currentPlayer is defined before accessing its side */}
        {currentPlayer && <p>You are the {currentPlayer.side} player</p>}
        {/* You could also add the player's socket ID for debugging */}
        {currentPlayer && <p>(Your ID: {currentPlayer.id})</p>}
      </div>

      {/* Optional: Display a specific message after game end */}
      {/* {gameState?.gameStatus === 'finished' && <p>Click "Join Game" to play again!</p>} */}
    </div>
  );
};

export default App;
