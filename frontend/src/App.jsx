import { Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import UserPage from "./Pages/UserPage";
import PostPage from "./Pages/PostPage";
import Header from "./Components/Header";
import HomePage from "./Pages/HomePage";
import AuthPage from "./Pages/AuthPage";
import UpdateProfilePage from "./Pages/UpdateProfilePage";
import { useRecoilState } from "recoil";
import userAtom from "./atoms/userAtom";
import CreatePost from "./Components/CreatePost";
import ChatPage from "./Pages/ChatPage";
import { SettingsPage } from "./Pages/SettingsPage";
import SearchPage from "./Pages/SearchPage";
import { useTheme } from "./context/ThemeContext";

const App = () => {
  const { isDarkMode, toggleColorMode } = useTheme();
  const [user, setUser] = useRecoilState(userAtom);

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
      className="w-full min-h-screen min-h-[100dvh] relative px-2 pt-2 pb-24 sm:px-3 md:pb-2 bg-white dark:bg-ebony transition-colors duration-300"
    >
      <div className="w-full max-w-[1000px] mx-auto px-1 sm:px-2 md:px-0 text-ebony dark:text-white">
        <Header isDarkMode={isDarkMode} toggleColorMode={toggleColorMode} />
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
        </Routes>
        {user && <CreatePost />}
      </div>
    </div>
  );
};

export default App;
