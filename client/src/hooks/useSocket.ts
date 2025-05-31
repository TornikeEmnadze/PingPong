import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/types/events";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  useEffect(() => {
    // Read the server URL from the environment variable set in .env BEFORE build
    // If VITE_SERVER_URL is not set (e.g., during local dev without a .env file),
    // fall back to localhost for convenience.
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    console.log('Connecting socket to:', serverUrl); // Log the URL being used

    const newSocket = io(serverUrl); // <-- Use the configured URL

    setSocket(newSocket);

    return () => {
      console.log('Disconnecting socket...');
      newSocket.disconnect();
    };
  }, []); // Empty dependency array: runs once on mount

  return socket;
};
