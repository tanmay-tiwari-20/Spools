import { useState } from "react";

export default function UpdateProfilePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  return (
    <div className="flex justify-center items-center px-4 py-8">
      <div className="grid gap-8 max-w-3xl w-full">
        <section
          id="update-profile"
          className="bg-gradient-to-r from-gray-200 to-gray-600 rounded-3xl"
        >
          <div className="border-8 border-transparent rounded-xl bg-white dark:bg-zinc-900 shadow-xl p-6 sm:p-8 md:p-10 m-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center cursor-default dark:text-gray-300 text-gray-900 mb-6">
              Edit Profile
            </h1>

            {/* User Avatar */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex justify-center">
                <img
                  className="rounded-full w-28 h-28 sm:w-32 sm:h-32"
                  src="https://bit.ly/sage-adebayo"
                  alt="User Avatar"
                />
              </div>
              <button className="w-full sm:w-auto bg-gradient-to-r from-gray-400 to-gray-700 text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg">
                Change Picture
              </button>
            </div>

            {/* Full Name */}
            <div className="mt-4">
              <label
                htmlFor="fullName"
                className="block mb-2 text-base sm:text-lg dark:text-gray-300"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border rounded-lg shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-500 transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Username */}
            <div className="mt-4">
              <label
                htmlFor="username"
                className="block mb-2 text-base sm:text-lg dark:text-gray-300"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border rounded-lg shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-500 transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Email */}
            <div className="mt-4">
              <label
                htmlFor="email"
                className="block mb-2 text-base sm:text-lg dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-500 transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Password */}
            <div className="mt-4">
              <label
                htmlFor="password"
                className="block mb-2 text-base sm:text-lg dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-500 transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Bio */}
            <div className="mt-4">
              <label
                htmlFor="bio"
                className="block mb-2 text-base sm:text-lg dark:text-gray-300"
              >
                Bio
              </label>
              <textarea
                id="bio"
                placeholder="Tell something about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 border rounded-lg shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-500 transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col justify-between sm:flex-row gap-4 mt-6">
              <button className="w-full sm:w-auto bg-gray-300 dark:bg-gray-500 dark:text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg">
                Cancel
              </button>
              <button className="w-full sm:w-auto bg-gradient-to-r from-gray-400 to-gray-700 text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg">
                Save Changes
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
