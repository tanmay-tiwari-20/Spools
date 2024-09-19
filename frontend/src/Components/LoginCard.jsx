import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";

const LoginCard = ({ setAuthScreen }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/api/users/login", { username, password });

      // Save user details to localStorage
      localStorage.setItem("user-spools", JSON.stringify(res.data));

      // Show success toast
      toast({
        title: "Login successful",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // Redirect to homepage
      navigate("/");
    } catch (error) {
      console.log("Login error: ", error.response?.data || error.message);

      // Show error toast
      toast({
        title: "Login failed",
        description: error.response?.data?.error || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <div className="flex justify-center items-center px-4">
      <div className="grid gap-8 max-w-lg w-full">
        <section
          id="back-div"
          className="bg-gradient-to-r from-gray-200 to-gray-600 rounded-3xl"
        >
          <div className="border-8 border-transparent rounded-xl bg-white dark:bg-zinc-900 shadow-xl p-6 sm:p-8 md:p-10 m-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center cursor-default dark:text-gray-300 text-gray-900 mb-4">
              Log in
            </h1>
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block mb-2 lg:text-lg text-base dark:text-gray-300"
                >
                  Username
                </label>
                <input
                  id="username"
                  className="border p-3 shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-gray-500 transition transform hover:scale-105 duration-300"
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block mb-2 lg:text-lg text-base dark:text-gray-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  className="border p-3 shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-gray-500 transition transform hover:scale-105 duration-300"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 lg:top-16 top-14 transform -translate-y-1/2 text-gray-400"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <a className="text-gray-400 text-sm transition hover:underline">
                Forgot your password?
              </a>
              <button
                className="w-full p-3 mt-4 text-white bg-gradient-to-r from-gray-400 to-gray-700 rounded-lg hover:scale-105 transition transform duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                type="submit"
              >
                LOG IN
              </button>
            </form>
            <div className="flex flex-col mt-4 text-sm text-center dark:text-gray-300">
              <p>
                Don&apos;t have an account?{" "}
                <a
                  className="text-gray-400 transition hover:underline cursor-pointer"
                  onClick={() => setAuthScreen("signup")}
                >
                  Sign Up
                </a>
              </p>
            </div>
            <div className="mt-4 text-center text-sm ">
              <p>
                By logging in, you agree to our{" "}
                <a
                  href="#"
                  className="text-gray-400 transition hover:underline"
                >
                  Terms{" "}
                </a>
                and{" "}
                <a
                  href="#"
                  className="text-gray-400 transition hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginCard;
