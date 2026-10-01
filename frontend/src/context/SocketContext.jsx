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

    const reportVisibility = () => {
      newSocket.emit("clientVisibility", !document.hidden && document.hasFocus());
    };
    const handleConnect = () => reportVisibility();
    newSocket.on("connect", handleConnect);
    document.addEventListener("visibilitychange", reportVisibility);
    window.addEventListener("focus", reportVisibility);
    window.addEventListener("blur", reportVisibility);

    // Listen for online users list
    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // Clean up on component unmount or when user changes
    return () => {
      newSocket.off("connect", handleConnect);
      document.removeEventListener("visibilitychange", reportVisibility);
      window.removeEventListener("focus", reportVisibility);
      window.removeEventListener("blur", reportVisibility);
      if (newSocket) newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
