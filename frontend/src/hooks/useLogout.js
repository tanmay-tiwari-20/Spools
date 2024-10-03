import userAtom from "../atoms/userAtom";
import { useSetRecoilState } from "recoil";
import useShowToast from "./useShowToast";

const useLogout = () => {
  const setUser = useSetRecoilState(userAtom);
  const showToast = useShowToast();

  const logout = async () => {
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

      console.log("Logging out and removing user from localStorage...");

      // Remove from localStorage
      localStorage.removeItem("user-spools");
      
      // Update Recoil state
      setUser(null);

      // Optional: Refresh the page to clear client-side cache
      window.location.reload();
      
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  return logout;
};

export default useLogout;
