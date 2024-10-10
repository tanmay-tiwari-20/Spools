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
    if (!user?._id) return;

    // Establish socket connection only if a user is logged in
    const newSocket = io("/", {
      query: { userId: user._id },
      withCredentials: true, // If you're using cookies for authentication
    });

    setSocket(newSocket);

    // Listen for online users list
    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // Clean up on component unmount or when user changes
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
