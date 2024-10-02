import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link } from "@chakra-ui/react";
import { AiFillHome } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { Link as RouterLink } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import useLogout from "../hooks/useLogout";

const Header = ({ isDarkMode, toggleColorMode }) => {
  const user = useRecoilValue(userAtom);
  const logout = useLogout();

  return (
    <header
      className={`flex items-center py-4 bg-white dark:bg-ebony transition duration-500 ${
        user ? "justify-between" : "justify-center"
      }`}
    >
      {/* Home Icon */}
      {user && (
        <Link
          as={RouterLink}
          to="/"
          className="text-ebony dark:text-white hover:text-gray-500 dark:hover:text-softPurple transition duration-300"
        >
          <AiFillHome size={28} />
        </Link>
      )}

      {/* Toggle Dark/Light Mode */}
      <img
        src={isDarkMode ? "/dark-mode.svg" : "/light-mode.svg"}
        alt="Toggle Color Mode"
        className="cursor-pointer w-10 h-10 select-none hover:scale-110 transition duration-300"
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
            <RxAvatar size={28} />
          </Link>
          <button
            className="text-ebony dark:text-white hover:text-gray-500 dark:hover:text-softPurple transition duration-300"
            onClick={logout}
          >
            <FiLogOut size={26} className="md:w-5 md:h-5" />
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
