import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import UserPage from "./Pages/UserPage";
import PostPage from "./Pages/PostPage";
import Header from "./Components/Header";
import HomePage from "./Pages/HomePage";
import AuthPage from "./Pages/AuthPage";
import UpdateProfilePage from "./Pages/UpdateProfilePage";
import { useRecoilState, useSetRecoilState } from "recoil";
import userAtom from "./atoms/userAtom";
import postsAtom from "./atoms/postsAtom";
import { conversationsAtom, selectedConversationAtom } from "./atoms/messagesAtom";
import CreatePost from "./Components/CreatePost";
import ChatPage from "./Pages/ChatPage";
import { SettingsPage } from "./Pages/SettingsPage";
import SearchPage from "./Pages/SearchPage";
import CirclesPage from "./Pages/CirclesPage";
import SeriesPage from "./Pages/SeriesPage";
import { useTheme } from "./context/ThemeContext";
import NotificationManager from "./Components/NotificationManager";
import { useSocket } from "./context/SocketContext.jsx";

const App = () => {
  const { isDarkMode, toggleColorMode } = useTheme();
  const [user, setUser] = useRecoilState(userAtom);
  const setPosts = useSetRecoilState(postsAtom);
  const setConversations = useSetRecoilState(conversationsAtom);
  const setSelectedConversation = useSetRecoilState(selectedConversationAtom);
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const isChat = location.pathname === "/chat";

  useEffect(() => {
    if (!socket) return undefined;

    const handleAccountFrozen = ({ userId, username }) => {
      const frozenId = String(userId || "");
      if (!frozenId) return;
      setPosts((previous) => previous
        .filter((post) => String(post?.postedBy?._id || post?.postedBy) !== frozenId)
        .map((post) => ({
          ...post,
          replies: (post.replies || []).filter((reply) => String(reply.userId) !== frozenId),
        })));
      setConversations((previous) => previous.filter((conversation) =>
        !(conversation.participants || []).some((person) => String(person?._id || person) === frozenId)
      ));
      setSelectedConversation((current) => String(current?.userId || "") === frozenId
        ? { ...current, unavailable: true }
        : current);

      const frozenProfilePath = username ? `/${username}` : "";
      if (frozenProfilePath && (location.pathname === frozenProfilePath || location.pathname.startsWith(`${frozenProfilePath}/`))) {
        navigate("/");
      }
    };

    const handleAccountRestored = async ({ userId } = {}) => {
      if (userId) {
        setSelectedConversation((current) => String(current?.userId || "") === String(userId)
          ? { ...current, unavailable: false }
          : current);
      }
      try {
        const response = await fetch("/api/messages/conversations");
        const data = await response.json();
        if (response.ok && Array.isArray(data)) setConversations(data);
      } catch {
        // The next chat-page visit will refresh the conversation list.
      }
      window.dispatchEvent(new CustomEvent("spools:account-restored"));
    };

    socket.on("accountFrozen", handleAccountFrozen);
    socket.on("accountRestored", handleAccountRestored);
    return () => {
      socket.off("accountFrozen", handleAccountFrozen);
      socket.off("accountRestored", handleAccountRestored);
    };
  }, [socket, setPosts, setConversations, setSelectedConversation, location.pathname, navigate]);

  // Listen for global unauthorized events (e.g., 401 on expired session)
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem("user-spools");
      setUser(null);
    };

    window.addEventListener("spools:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("spools:unauthorized", handleUnauthorized);
    };
  }, [setUser]);

  // Proactive session validation when returning to the app after a long time
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const verifySession = async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.status === 401) {
          console.warn("Session expired. Automatically signing out.");
          localStorage.removeItem("user-spools");
          if (isMounted) setUser(null);
          return;
        }

        if (res.ok) {
          const freshUser = await res.json();
          if (freshUser && !freshUser.error && isMounted) {
            localStorage.setItem("user-spools", JSON.stringify(freshUser));
            setUser(freshUser);
          }
        }
      } catch (err) {
        // If offline, do not clear local user
        console.warn("Could not verify session with server:", err.message);
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className={`relative min-h-screen min-h-[100dvh] w-full bg-white transition-colors duration-300 dark:bg-ebony ${isChat ? "px-0 pt-0 pb-0 md:px-3 md:pt-2 md:pb-2" : "px-2 pt-2 pb-24 sm:px-3 md:pb-2"}`}
    >
      <div className={`w-full ${isChat ? "max-w-[1280px] px-0 md:px-0" : "max-w-[1000px] px-1 sm:px-2 md:px-0"} mx-auto text-ebony dark:text-white`}>
        <Header isDarkMode={isDarkMode} toggleColorMode={toggleColorMode} />
        {user && <NotificationManager />}
        <Routes>
          <Route
            path="/"
            element={user ? <HomePage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/auth"
            element={!user ? <AuthPage /> : <Navigate to="/" />}
          />
          <Route
            path="/update"
            element={user ? <UpdateProfilePage /> : <Navigate to="/auth" />}
          />

          <Route path="/:username" element={<UserPage />} />
          <Route path="/:username/post/:pid" element={<PostPage />} />
          <Route
            path="/chat"
            element={user ? <ChatPage /> : <Navigate to={"/auth"} />}
          />
          <Route
            path="/search"
            element={user ? <SearchPage /> : <Navigate to={"/auth"} />}
          />
          <Route
            path="/settings"
            element={user ? <SettingsPage isDarkMode={isDarkMode} toggleColorMode={toggleColorMode} /> : <Navigate to={"/auth"} />}
          />
          <Route path="/circles" element={user ? <CirclesPage /> : <Navigate to="/auth" />} />
          <Route path="/circles/:id" element={user ? <CirclesPage /> : <Navigate to="/auth" />} />
          <Route path="/series" element={user ? <SeriesPage /> : <Navigate to="/auth" />} />
          <Route path="/series/:id" element={user ? <SeriesPage /> : <Navigate to="/auth" />} />
        </Routes>
        {user && location.pathname !== "/chat" && <CreatePost />}
      </div>
    </div>
  );
};

export default App;
