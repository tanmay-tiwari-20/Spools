import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import authScreenAtom from "../atoms/authAtom";
import { useSetRecoilState } from "recoil";
import useShowToast from "../hooks/useShowToast";
import userAtom from "../atoms/userAtom";
import { useTheme } from "../context/ThemeContext";

const SignupCard = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const { toggleColorMode, isDarkMode } = useTheme();
  const [inputs, setInputs] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const showToast = useShowToast();
  const setUser = useSetRecoilState(userAtom);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
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
        setLoading(false);
        return;
      }

      localStorage.setItem("user-spools", JSON.stringify(data));
      setUser(data);
      showToast("Success", "Account created successfully!", "success");
    } catch (error) {
      showToast("Error", error.message || "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-w-0 justify-center items-center py-3 sm:py-10 px-0 min-[400px]:px-1 sm:px-4">
      <div className="w-full min-w-0 max-w-md bg-white dark:bg-zinc-900/90 rounded-2xl sm:rounded-3xl p-4 min-[400px]:p-5 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-xl backdrop-blur-md">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <button
              type="button"
              onClick={toggleColorMode}
              className="p-1 rounded-2xl hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer focus:outline-none"
              title={`Spools • Click to switch to ${isDarkMode ? "Light" : "Dark"} mode`}
              aria-label="Toggle theme"
            >
              <img
                src="/dark-mode.svg"
                alt="Spools Logo"
                className="w-12 h-12 object-contain dark:hidden"
              />
              <img
                src="/light-mode.svg"
                alt="Spools Logo"
                className="w-12 h-12 object-contain hidden dark:block"
              />
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Join Spools and connect with everyone
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Full Name
              </label>
              <input
                id="name"
                className="w-full px-4 py-3 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all"
                type="text"
                placeholder="John Doe"
                required
                value={inputs.name}
                onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                className="w-full px-4 py-3 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all"
                type="text"
                placeholder="johndoe"
                required
                value={inputs.username}
                onChange={(e) =>
                  setInputs({ ...inputs, username: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              className="w-full px-4 py-3 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all"
              type="email"
              placeholder="name@example.com"
              required
              value={inputs.email}
              onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full px-4 py-3 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                required
                minLength={6}
                value={inputs.password}
                onChange={(e) =>
                  setInputs({ ...inputs, password: e.target.value })
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          <button
            className={`w-full py-3.5 mt-2 text-sm font-semibold rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all duration-200 active:scale-98 ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Creating account...</span>
              </div>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Already have an account?{" "}
            <button
              className="font-bold text-zinc-900 dark:text-white hover:underline cursor-pointer ml-1"
              onClick={() => setAuthScreen("login")}
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupCard;
