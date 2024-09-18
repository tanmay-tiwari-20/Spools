const Header = ({ isDarkMode, toggleColorMode }) => {
    return (
      <header className="flex justify-center items-center p-4 bg-white dark:bg-ebony transition duration-500">
        {/* Image for toggling color mode (centered in the header) */}
        <img
          src={isDarkMode ? "/dark-mode.svg" : "/light-mode.svg"}
          alt="Toggle Color Mode"
          className="cursor-pointer w-12 h-12 mt-2 select-none"
          onClick={toggleColorMode}
        />
      </header>
    );
  };
  
  export default Header;
  