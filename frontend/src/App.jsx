import { Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import UserPage from "./Pages/UserPage";
import PostPage from "./Pages/PostPage";
import Header from "./Components/Header";
import HomePage from "./Pages/HomePage";
import AuthPage from "./Pages/AuthPage";
import UpdateProfilePage from "./Pages/UpdateProfilePage";
import { useRecoilValue } from "recoil";
import userAtom from "./atoms/userAtom";
import CreatePost from "./Components/CreatePost";
import ChatPage from "./Pages/ChatPage";
import { SettingsPage } from "./Pages/SettingsPage";

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const user = useRecoilValue(userAtom);

  // Toggle function for color mode
  const toggleColorMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Apply the dark mode class on initial load
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [isDarkMode]);

  return (
    <div
      className={`w-full min-h-screen relative p-2 bg-white dark:bg-ebony transition duration-500`}
    >
      <div className="max-w-[1000px] mx-auto px-3 md:px-0  text-ebony dark:text-white">
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

          <Route
            path="/:username"
            element={
              user ? (
                <>
                  <UserPage />
                  <CreatePost />
                </>
              ) : (
                <UserPage />
              )
            }
          />
          <Route path="/:username/post/:pid" element={<PostPage />} />
          <Route
            path="/chat"
            element={user ? <ChatPage /> : <Navigate to={"/auth"} />}
          />
          <Route
            path="/settings"
            element={user ? <SettingsPage /> : <Navigate to={"/auth"} />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
