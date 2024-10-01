import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { FiLogOut } from "react-icons/fi";

const LogoutButton = () => {
  const setUser = useSetRecoilState(userAtom);
  const showToast = useShowToast();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/users/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      localStorage.removeItem("user-spools");
      setUser(null);
    } catch (error) {
      showToast("Error", error.message || "Logout failed", "error");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="fixed top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-semibold text-white bg-gray-500 rounded-full shadow-md transition duration-300 hover:bg-gray-500/80 dark:bg-softPurple dark:text-white dark:hover:bg-softPurple/90"
    >
      <FiLogOut size={18} className="md:w-5 md:h-5" />
      <span className="hidden md:block">Logout</span>
    </button>
  );
};

export default LogoutButton;
