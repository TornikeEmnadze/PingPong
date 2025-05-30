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
    const newSocket = io("http://localhost:3001");

    setSocket(newSocket);

    return () => {
      console.log("Disconnecting socket..."); // Add log for clarity
      newSocket.disconnect();
    };
  }, []);

  return socket;
};
