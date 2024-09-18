import { Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Make a request to the backend to clear the JWT cookie
      const res = await fetch("/api/users/logout", {
        method: "POST",
        credentials: "include", // This ensures that cookies are included in the request
      });

      const data = await res.json();

      if (res.ok) {
        // Clear the localStorage data (user's authentication info)
        localStorage.removeItem("user-spools");

        // Redirect the user to the authentication page
        navigate("/auth");
      } else {
        console.log("Error logging out:", data.error);
      }
    } catch (error) {
      console.log("Error logging out:", error);
    }
  };

  return (
    <Button
      position={"fixed"}
      top={"30px"}
      right={"30px"}
      size={"sm"}
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
