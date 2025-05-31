import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { Game } from "./models/Game";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../client/shared/types/events";

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    // ADD your EC2 public IP and port (3001) to the origin list
    origin: ["http://localhost:3000", "http://localhost:5173", "http://51.20.114.126:3001"],
    methods: ["GET", "POST"],
  },
});

const game = new Game();

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("joinGame", () => {
    const player = game.addPlayer(socket.id);

    if (player) {
      socket.emit("playerJoined", player.toPlayerData());
      io.emit("gameStateUpdate", game.getGameState());

      if (game.gameStatus === "playing") {
        io.emit("gameStart");
      }
    } else {
      socket.emit("error", "Game is full");
    }
  });

  socket.on("paddleMove", (direction) => {
    const player = game.players.get(socket.id);
    if (player) {
      player.startMoving(direction);
    }
  });

  socket.on("paddleStop", () => {
    const player = game.players.get(socket.id);
    if (player) {
      player.stopMoving();
    }
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    game.removePlayer(socket.id);
    io.emit("playerLeft", socket.id);
    io.emit("gameStateUpdate", game.getGameState());
  });
});

// Broadcast game state updates
setInterval(() => {
  if (game.gameStatus === "playing") {
    io.emit("gameStateUpdate", game.getGameState());
  }
}, 1000 / 60); // 60 FPS

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
