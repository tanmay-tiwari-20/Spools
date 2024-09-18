import { Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import UserPage from "./Pages/UserPage";
import PostPage from "./Pages/PostPage";
import Header from "./Components/Header";
import HomePage from "./Pages/HomePage";
import AuthPage from "./Pages/AuthPage";

const App = () => {
  // State to manage color mode (light or dark)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle function to change color mode
  const toggleColorMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Effect to apply the dark mode class on the initial load
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
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/:username" element={<UserPage />} />
          <Route path="/:username/post/:pid" element={<PostPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
