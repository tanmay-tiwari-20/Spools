import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link } from "@chakra-ui/react";
import { AiFillHome } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { Link as RouterLink } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { IoChatbubbleEllipsesSharp } from "react-icons/io5";
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";

const Header = ({ isDarkMode, toggleColorMode }) => {
  const user = useRecoilValue(userAtom);
  const logout = useLogout();
  const setAuthScreen = useSetRecoilState(authScreenAtom);

  return (
    <header className="flex items-center py-4 bg-white dark:bg-ebony transition duration-500 justify-between ">
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
          user && "ml-10"
        } select-none hover:scale-110 transition duration-300`}
        onClick={toggleColorMode}
      />

      {/* Avatar Icon */}
      {user && (
        <div className="flex items-center gap-4">
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
            onClick={logout} // Call logout here
          >
            <FiLogOut className="text-2xl md:text-3xl" />
          </button>
        </div>
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
