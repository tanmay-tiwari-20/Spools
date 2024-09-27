import { useRecoilValue } from "recoil";
import authScreenAtom from "../atoms/authAtom";
import SignupCard from "../Components/SignupCard";
import LoginCard from "../Components/LoginCard";

const AuthPage = () => {
  const authScreenState = useRecoilValue(authScreenAtom);

  return authScreenState === "login" ? <LoginCard /> : <SignupCard />;
};

export default AuthPage;
