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

    const socketUrl =
      import.meta.env.MODE === "development"
        ? "http://localhost:5000"
        : "/";

    // Establish socket connection directly to backend in development
    const newSocket = io(socketUrl, {
      query: { userId: user._id },
      withCredentials: true,
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
