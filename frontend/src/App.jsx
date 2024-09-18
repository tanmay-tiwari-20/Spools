import { Route, Routes, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import UserPage from "./Pages/UserPage";
import PostPage from "./Pages/PostPage";
import Header from "./Components/Header";
import HomePage from "./Pages/HomePage";
import AuthPage from "./Pages/AuthPage";
import LogoutButton from "./Components/LogoutButton";

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate(); // For navigation

  // Function to check if the user is authenticated
  const checkAuthentication = () => {
    const user = localStorage.getItem("user-spools");
    return user !== null; // Returns true if user exists
  };

  // Toggle function for color mode
  const toggleColorMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // On component mount, check if the user is authenticated
  useEffect(() => {
    const authenticated = checkAuthentication();
    setIsAuthenticated(authenticated);

    if (!authenticated) {
      // If not authenticated, redirect to /auth
      navigate("/auth");
    }
  }, [navigate]);

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
            element={isAuthenticated ? <HomePage /> : <AuthPage />}
          />
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/:username" element={<UserPage />} />
          <Route path="/:username/post/:pid" element={<PostPage />} />
        </Routes>

        {/* Conditionally render the LogoutButton only if authenticated */}
        {isAuthenticated && <LogoutButton />}
      </div>
    </div>
  );
};

export default App;
