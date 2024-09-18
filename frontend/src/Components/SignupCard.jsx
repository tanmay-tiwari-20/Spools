import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const SignupCard = ({ setAuthScreen }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
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
            <form action="#" method="post" className="space-y-4 sm:space-y-6">
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
                  required=""
                />
              </div>
              <div>
                <label
                  htmlFor="FullName"
                  className="block mb-2 lg:text-lg text-base dark:text-gray-300"
                >
                  Full Name
                </label>
                <input
                  id="FullName"
                  className="border p-3 shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-gray-500 transition transform hover:scale-105 duration-300"
                  type="text"
                  placeholder="Full Name"
                  required=""
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
                  required=""
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
                  required=""
                />
                <button
                  type="button"
                  className="absolute right-3 lg:top-16 top-14 transform -translate-y-1/2 text-gray-400"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <button
                className="w-full p-3 mt-4 text-white bg-gradient-to-r from-gray-400 to-gray-700 rounded-lg hover:scale-105 transition transform duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                type="submit"
              >
                SIGN UP
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
