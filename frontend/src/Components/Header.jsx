import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AiFillHome, AiOutlineHome } from "react-icons/ai";
import { FiLogOut, FiSearch, FiSettings } from "react-icons/fi";
import { IoChatbubbleEllipsesSharp, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";
import { useTheme } from "../context/ThemeContext";

const Header = ({ isDarkMode: propIsDark, toggleColorMode: propToggle }) => {
  const user = useRecoilValue(userAtom);
  const logout = useLogout();
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const location = useLocation();
  const themeContext = useTheme();

  const isDarkMode = propIsDark !== undefined ? propIsDark : themeContext?.isDarkMode;
  const toggleColorMode = propToggle || themeContext?.toggleColorMode;

  const isHome = location.pathname === "/";
  const isSearch = location.pathname === "/search";
  const isChat = location.pathname === "/chat";
  const isSettings = location.pathname === "/settings";
  const isProfile = user && location.pathname === `/${user.username}`;

  return (
    <>
      {/* Top Glass Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-ebony/80 border-b border-zinc-200/60 dark:border-zinc-800/60 transition-colors duration-300 py-3 px-4 mb-4 rounded-b-2xl">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Left: Brand Logo (Toggles theme on click) & Home Link */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleColorMode}
              className="relative p-1 rounded-xl transition-transform duration-150 hover:scale-105 active:scale-95 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer focus:outline-none select-none"
              title={`Spools • Click logo to switch to ${isDarkMode ? "Light" : "Dark"} mode`}
              aria-label="Click Spools logo to toggle theme"
            >
              <img
                src="/dark-mode.svg"
                alt="Spools Logo"
                className="w-8 h-8 object-contain dark:hidden"
              />
              <img
                src="/light-mode.svg"
                alt="Spools Logo"
                className="w-8 h-8 object-contain hidden dark:block"
              />
            </button>

            <RouterLink
              to="/"
              className="font-extrabold text-xl tracking-tight text-zinc-900 dark:text-white hover:opacity-80 transition-opacity hidden sm:inline select-none"
              title="Spools Home"
            >
              Spools
            </RouterLink>
          </div>

          {/* Center (Desktop): Quick Nav */}
          {user ? (
            <nav className="hidden md:flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-200/60 dark:border-zinc-800/60">
              <RouterLink
                to="/"
                className={`p-2 rounded-full transition-all ${
                  isHome
                    ? "text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
                title="Home"
              >
                {isHome ? <AiFillHome size={22} /> : <AiOutlineHome size={22} />}
              </RouterLink>

              <RouterLink
                to="/search"
                className={`p-2 rounded-full transition-all ${
                  isSearch
                    ? "text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
                title="Search"
              >
                <FiSearch size={20} />
              </RouterLink>

              <RouterLink
                to="/chat"
                className={`p-2 rounded-full transition-all ${
                  isChat
                    ? "text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
                title="Direct Messages"
              >
                {isChat ? (
                  <IoChatbubbleEllipsesSharp size={20} />
                ) : (
                  <IoChatbubbleEllipsesOutline size={20} />
                )}
              </RouterLink>

              <RouterLink
                to={`/${user.username}`}
                className={`p-1.5 rounded-full transition-all ${
                  isProfile
                    ? "ring-2 ring-zinc-900 dark:ring-white"
                    : "opacity-80 hover:opacity-100"
                }`}
                title="Your Profile"
              >
                <img
                  src={user.profilePic || "/defaultdp.png"}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              </RouterLink>
            </nav>
          ) : (
            <div className="font-semibold text-sm text-zinc-500 dark:text-zinc-400">
              Welcome to the conversation
            </div>
          )}

          {/* Right: Settings & User Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <RouterLink
                  to="/settings"
                  className={`p-2.5 rounded-full transition-all duration-200 active:scale-95 ${
                    isSettings
                      ? "bg-zinc-200/90 dark:bg-zinc-800 text-zinc-950 dark:text-white ring-1 ring-zinc-300 dark:ring-zinc-700 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                  title="Settings"
                  aria-label="Settings"
                >
                  <FiSettings size={19} />
                </RouterLink>

                <button
                  onClick={logout}
                  className="hidden sm:flex items-center gap-1.5 py-2 px-3 text-sm font-semibold rounded-full text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 active:scale-95"
                  title="Log out"
                >
                  <FiLogOut size={17} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <RouterLink
                  to="/auth"
                  onClick={() => setAuthScreen("login")}
                  className="px-4 py-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white transition-colors"
                >
                  Log in
                </RouterLink>
                <RouterLink
                  to="/auth"
                  onClick={() => setAuthScreen("signup")}
                  className="px-4 py-1.5 text-sm font-semibold rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all"
                >
                  Sign up
                </RouterLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Floating Bottom Bar */}
      {user && (
        <div className="md:hidden fixed bottom-3 left-4 right-4 z-50 backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-full shadow-lg px-4 py-2.5 flex items-center justify-around">
          <RouterLink
            to="/"
            className={`p-2 transition-colors ${
              isHome
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            {isHome ? <AiFillHome size={24} /> : <AiOutlineHome size={24} />}
          </RouterLink>

          <RouterLink
            to="/search"
            className={`p-2 transition-colors ${
              isSearch
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            <FiSearch size={22} />
          </RouterLink>

          <RouterLink
            to="/chat"
            className={`p-2 transition-colors ${
              isChat
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            {isChat ? (
              <IoChatbubbleEllipsesSharp size={22} />
            ) : (
              <IoChatbubbleEllipsesOutline size={22} />
            )}
          </RouterLink>

          <RouterLink
            to={`/${user.username}`}
            className="p-1 transition-transform active:scale-95"
          >
            <img
              src={user.profilePic || "/defaultdp.png"}
              alt={user.name}
              className={`w-7 h-7 rounded-full object-cover ${
                isProfile ? "ring-2 ring-zinc-900 dark:ring-white" : ""
              }`}
            />
          </RouterLink>

          <RouterLink
            to="/settings"
            className={`p-2 transition-colors ${
              isSettings
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
            title="Settings"
          >
            <FiSettings size={22} />
          </RouterLink>
        </div>
      )}
    </>
  );
};

export default Header;
