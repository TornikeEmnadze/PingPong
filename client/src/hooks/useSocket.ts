import { useEffect, useState } from "react"; // Use useState instead of useRef
import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/types/events";

export const useSocket = () => {
  // Use state to hold the socket instance. Initial state is null.
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  useEffect(() => {
    // Create the socket instance
    const newSocket = io("http://localhost:3001"); // Consider using env var here

    // Update the state with the new socket instance
    setSocket(newSocket);

    // Return a cleanup function that disconnects the socket when the component unmounts
    return () => {
      console.log("Disconnecting socket..."); // Add log for clarity
      newSocket.disconnect();
    };
  }, []); // Empty dependency array: this effect runs only once on mount

  // Return the socket instance from state
  return socket;
};
