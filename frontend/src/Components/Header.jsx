import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link } from "@chakra-ui/react";
import { AiFillHome } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { Link as RouterLink } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { IoChatbubbleEllipsesSharp, IoMenu, IoClose } from "react-icons/io5"; // Import IoClose icon
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";
import { useState } from "react";

const Header = ({ isDarkMode, toggleColorMode }) => {
  const user = useRecoilValue(userAtom);
  const logout = useLogout();
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="flex items-center py-4 bg-white dark:bg-ebony transition duration-500 justify-between">
      {/* Home Icon */}
      {user && (
        <Link
          as={RouterLink}
          to="/"
          className="text-ebony dark:text-white hover:text-gray-500 dark:hover:text-softPurple transition duration-300"
        >
          <AiFillHome className="text-2xl md:text-3xl" />
        </Link>
      )}

      {!user && (
        <Link
          as={RouterLink}
          to="/auth"
          onClick={() => setAuthScreen("login")}
          className="px-4 py-2 shadow-md text-white rounded-full bg-gradient-to-r from-gray-400 to-gray-600 hover:scale-105 transition duration-300 text-sm md:text-base font-semibold hover:shadow-3xl hover:shadow-darkGray dark:hover:shadow-lightGray"
          style={{ textDecoration: "none", color: "white" }}
        >
          Login
        </Link>
      )}

      {/* Toggle Dark/Light Mode */}
      <img
        src={isDarkMode ? "/dark-mode.svg" : "/light-mode.svg"}
        alt="Toggle Color Mode"
        className={`cursor-pointer w-8 h-8 md:w-10 md:h-10 ${
          user && "md:ml-12 ml-0"
        } select-none hover:scale-110 transition duration-300`}
        onClick={toggleColorMode}
      />

      {user && (
        <>
          {/* Hamburger Icon for mobile */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-ebony dark:text-white focus:outline-none hover:text-gray-500 dark:hover:text-softPurple"
            >
              {/* Toggle between Hamburger and Close icon */}
              {isMenuOpen ? <IoClose size={28} /> : <IoMenu size={28} />}
            </button>
          </div>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              as={RouterLink}
              to={`/${user.username}`}
              className="text-ebony dark:text-white hover:text-gray-500 dark:hover:text-softPurple transition duration-300"
            >
              <RxAvatar className="text-2xl md:text-3xl" />
            </Link>
            <Link
              as={RouterLink}
              to={`/chat`}
              className="text-ebony dark:text-white hover:text-gray-500 dark:hover:text-softPurple transition duration-300"
            >
              <IoChatbubbleEllipsesSharp className="text-2xl md:text-3xl" />
            </Link>
            <button
              className="text-ebony dark:text-white hover:text-gray-500 dark:hover:text-softPurple transition duration-300"
              onClick={logout}
            >
              <FiLogOut className="text-2xl md:text-3xl" />
            </button>
          </div>

          {/* Mobile menu (shown only when hamburger is clicked) */}
          <div
            className={`absolute top-16 right-2 bg-white dark:bg-ebony rounded-full shadow-xl sm:hidden transition-all duration-500 ease-in-out z-50 ${
              isMenuOpen
                ? "opacity-100 visible transform translate-y-0"
                : "opacity-0 invisible transform -translate-y-5"
            }`}
          >
            <div className="flex flex-col items-center gap-4 p-4">
              <Link
                as={RouterLink}
                to={`/${user.username}`}
                className="text-ebony dark:text-white hover:text-gray-500 dark:hover:text-softPurple transition duration-300"
                onClick={() => setIsMenuOpen(false)} // Close menu on click
              >
                <RxAvatar className="text-2xl" />
              </Link>
              <Link
                as={RouterLink}
                to={`/chat`}
                className="text-ebony dark:text-white hover:text-gray-500 dark:hover:text-softPurple transition duration-300"
                onClick={() => setIsMenuOpen(false)} // Close menu on click
              >
                <IoChatbubbleEllipsesSharp className="text-2xl" />
              </Link>
              <button
                className="text-ebony dark:text-white hover:text-gray-500 dark:hover:text-softPurple transition duration-300"
                onClick={() => {
                  logout();
                  setIsMenuOpen(false); // Close menu on logout
                }}
              >
                <FiLogOut className="text-2xl" />
              </button>
            </div>
          </div>
        </>
      )}

      {!user && (
        <Link
          as={RouterLink}
          to="/auth"
          onClick={() => setAuthScreen("signup")}
          className="px-4 py-2 shadow-md rounded-full bg-gradient-to-r from-gray-400 to-gray-600 hover:scale-105 transition duration-300 text-sm md:text-base font-semibold hover:shadow-3xl hover:shadow-darkGray dark:hover:shadow-lightGray"
          style={{ textDecoration: "none", color: "white" }}
        >
          Signup
        </Link>
      )}
    </header>
  );
};

export default Header;
