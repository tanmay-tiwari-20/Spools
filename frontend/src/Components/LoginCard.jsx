import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import userAtom from "../atoms/userAtom";
import authScreenAtom from "../atoms/authAtom";
import useShowToast from "../hooks/useShowToast";
import { useSetRecoilState } from "recoil";

const LoginCard = () => {
  const [showPassword, setShowPassword] = useState(false);
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const setUser = useSetRecoilState(userAtom);
  const [loading, setLoading] = useState(false);

  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });

  const showToast = useShowToast();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true);
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();

      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      setUser(data);
      localStorage.setItem("user-spools", JSON.stringify(data));

      showToast("Success", "Login successful!", "success");
    } catch (error) {
      showToast("Error", error.message || "Login failed", "error");
    } finally {
      setLoading(false); // Set loading back to false
    }
  };

  return (
    <div className="flex justify-center items-center p-4 mt-4">
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
                  value={inputs.username}
                  onChange={(e) =>
                    setInputs({ ...inputs, username: e.target.value })
                  }
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
                  value={inputs.password}
                  onChange={(e) =>
                    setInputs({ ...inputs, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute right-3 lg:top-16 top-14 transform -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
              <a className="text-gray-400 text-sm transition hover:underline">
                Forgot your password?
              </a>
              <button
                className={`w-full p-3 mt-4 text-white bg-gradient-to-r from-gray-400 to-gray-700 rounded-lg hover:scale-105 transition transform duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  </div>
                ) : (
                  "LOG IN"
                )}
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
