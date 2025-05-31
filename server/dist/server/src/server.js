"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const Game_1 = require("./models/Game");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:5173", "http://51.20.76.58:3001"],
        methods: ["GET", "POST"],
    },
});
const clientBuildPath = path_1.default.join(__dirname, '../../client/dist');
console.log(`Attempting to serve client static files from: ${clientBuildPath}`);
app.use(express_1.default.static(clientBuildPath));
app.get('*', (req, res) => {
    console.log(`Serving index.html for request: ${req.method} ${req.path}`);
    res.sendFile(path_1.default.join(clientBuildPath, 'index.html'), (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error loading the game.');
        }
        else {
            console.log('Successfully served index.html');
        }
    });
});
const game = new Game_1.Game();
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
        }
        else {
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
setInterval(() => {
    if (game.gameStatus === "playing") {
        io.emit("gameStateUpdate", game.getGameState());
    }
}, 1000 / 60); // 60 FPS
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Serving client static files from: ${clientBuildPath}`);
    console.log(`Access your deployed game at: http://51.20.76.58:${PORT}`);
});
