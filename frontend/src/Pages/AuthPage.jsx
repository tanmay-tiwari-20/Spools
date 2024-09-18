import { useState } from "react";
import LoginCard from "../Components/LoginCard";
import SignupCard from "../Components/SignupCard";

const AuthContainer = () => {
  const [authScreen, setAuthScreen] = useState("login"); // State to toggle between login and signup

  return (
    <div className="flex justify-center items-center">
      {authScreen === "login" ? (
        <LoginCard setAuthScreen={setAuthScreen} />
      ) : (
        <SignupCard setAuthScreen={setAuthScreen} />
      )}
    </div>
  );
};

export default AuthContainer;
