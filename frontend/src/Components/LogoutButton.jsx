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
      showToast("Error", error, "error");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="fixed top-8 right-8 p-2 text-sm rounded-md bg-gray-300 text-ebony dark:bg-gray-500 dark:text-white hover:bg-gray-700 dark:hover:bg-gray-300 transition duration-300"
    >
      <FiLogOut size={20} />
    </button>
  );
};

export default LogoutButton;
