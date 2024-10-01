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
import LogoutButton from "./Components/LogoutButton";
import CreatePost from "./Components/CreatePost";

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
      className={`w-full min-h-screen p-2 bg-white dark:bg-ebony transition duration-500`}
    >
      <div className="max-w-[720px] mx-auto px-4 text-ebony dark:text-white">
        <Header isDarkMode={isDarkMode} toggleColorMode={toggleColorMode} />
        <Routes>
          {/* If authenticated, show HomePage, otherwise AuthPage */}
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
        </Routes>

        {user && <LogoutButton />}
        {user && <CreatePost />}
      </div>
    </div>
  );
};

export default App;
