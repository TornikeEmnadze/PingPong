import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { Game } from "./models/Game";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../client/shared/types/events";

const app = express();

const server = createServer(app);
const clientBuildPath = path.join(__dirname, "..", "..", "client", "dist");

console.log(`Serving client static files from: ${clientBuildPath}`);
app.use(express.static(clientBuildPath));

// Replace the problematic wildcard route
app.get('/', (req, res) => {
    console.log(`Serving index.html for request: ${req.method} ${req.path}`);
    res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            if (!res.headersSent) {
                res.status(500).send('Error loading the game.');
            }
        } else {
            console.log('Successfully served index.html');
        }
    });
});

app.use((req, res, next) => {
    // Skip if it's an API route or static file request
    if (req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
    }
    
    console.log(`Serving index.html for SPA route: ${req.method} ${req.path}`);
    res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            if (!res.headersSent) {
                res.status(500).send('Error loading the game.');
            }
        } else {
            console.log('Successfully served index.html');
        }
    });
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
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
  console.log(`Access the game at: http://51.20.114.126:${PORT}`);
});