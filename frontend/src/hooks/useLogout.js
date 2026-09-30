import userAtom from "../atoms/userAtom";
import { useSetRecoilState } from "recoil";
import useShowToast from "./useShowToast";

const useLogout = () => {
  const setUser = useSetRecoilState(userAtom);
  const showToast = useShowToast();

  const logout = async () => {
    try {
      await fetch("/api/users/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      // Unconditionally remove from localStorage and clear user state
      localStorage.removeItem("user-spools");
      setUser(null);
      showToast("Success", "Logged out successfully", "success");
    }
  };

  return logout;
};

export default useLogout;
