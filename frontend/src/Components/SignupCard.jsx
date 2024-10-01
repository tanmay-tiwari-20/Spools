import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import authScreenAtom from "../atoms/authAtom";
import { useSetRecoilState } from "recoil";
import useShowToast from "../hooks/useShowToast";
import userAtom from "../atoms/userAtom";

const SignupCard = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state for spinner
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const [inputs, setInputs] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const showToast = useShowToast();
  const setUser = useSetRecoilState(userAtom);

  const handleSignup = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true); // Start spinner when request is initiated
    try {
      const res = await fetch("/api/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();

      if (data.error) {
        showToast("Error", data.error, "error");
        setLoading(false); // Stop spinner on error
        return;
      }

      localStorage.setItem("user-spools", JSON.stringify(data));
      setUser(data);
      showToast("Success", "Signup successful!", "success");
    } catch (error) {
      showToast("Error", error.message || "Signup failed", "error");
    } finally {
      setLoading(false); // Stop spinner after request completes
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
              Sign Up
            </h1>
            <form onSubmit={handleSignup} className="space-y-4 sm:space-y-6">
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
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 lg:text-lg text-base dark:text-gray-300"
                >
                  Name
                </label>
                <input
                  id="name"
                  className="border p-3 shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-gray-500 transition transform hover:scale-105 duration-300"
                  type="text"
                  placeholder="Name"
                  required
                  value={inputs.name}
                  onChange={(e) =>
                    setInputs({ ...inputs, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 lg:text-lg text-base dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  className="border p-3 shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-gray-500 transition transform hover:scale-105 duration-300"
                  type="email"
                  placeholder="Email"
                  required
                  value={inputs.email}
                  onChange={(e) =>
                    setInputs({ ...inputs, email: e.target.value })
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
              <button
                className={`w-full p-3 mt-4 text-white rounded-lg transition transform duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-gray-400 to-gray-700 hover:scale-105"
                }`}
                type="submit"
                disabled={loading} // Disable button when loading
              >
                {loading ? (
                  <div className="flex justify-center items-center">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  "SIGN UP"
                )}
              </button>
            </form>
            <div className="flex flex-col mt-4 text-sm text-center dark:text-gray-300">
              <p>
                Already have an account?{" "}
                <a
                  className="text-gray-400 transition hover:underline cursor-pointer"
                  onClick={() => setAuthScreen("login")}
                >
                  Log In
                </a>
              </p>
            </div>
            <div className="mt-4 text-center text-sm ">
              <p>
                By signing up, you agree to our{" "}
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

export default SignupCard;
