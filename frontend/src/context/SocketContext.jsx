import { createContext, useContext, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import io from "socket.io-client";
import userAtom from "../atoms/userAtom";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const user = useRecoilValue(userAtom);

  useEffect(() => {
    console.log("User state:", user);

    if (!user?._id) {
      console.log("User ID is undefined. Skipping socket initialization.");
      return;
    }

    // Initialize the socket connection
    const socket = io("/", {
      query: {
        userId: user._id,
      },
    });

    setSocket(socket);
    console.log("Socket initialized for user:", user._id);

    // Handle receiving the list of online users
    socket.on("getOnlineUsers", (users) => {
      console.log("Online users received:", users);
      setOnlineUsers(users);
    });

    // Handle messages seen
    socket.on("messagesSeen", (data) => {
      console.log("Messages seen for conversation:", data.conversationId);
      // Here you can update the relevant conversation state or trigger a re-fetch
      // to ensure the UI reflects the seen status for the specific conversation.
    });

    // Clean up the socket connection on unmount
    return () => {
      console.log("Disconnecting socket for user:", user._id);
      socket.disconnect();
    };
  }, [user?._id]); // Dependency on user._id

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
