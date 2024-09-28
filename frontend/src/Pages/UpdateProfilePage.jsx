import { useRef, useState } from "react";
import userAtom from "../atoms/userAtom";
import { useRecoilState } from "recoil";
import useShowToast from "../hooks/useShowToast";
import usePreviewImg from "../hooks/usePreviewImg";

export default function UpdateProfilePage() {
  const [user, setUser] = useRecoilState(userAtom);
  const [inputs, setInputs] = useState({
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    password: "",
  });
  const fileRef = useRef(null);
  const [updating, setUpdating] = useState(false);

  const showToast = useShowToast();

  const { handleImageChange, imgUrl, selectedFile } = usePreviewImg();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (updating) return;

    // Basic validation
    if (!inputs.email.includes('@')) {
      showToast("Error", "Please enter a valid email address.", "error");
      return;
    }

    setUpdating(true);
    
    try {
      // Prepare form data for multipart/form-data request
      const formData = new FormData();
      formData.append("name", inputs.name);
      formData.append("username", inputs.username);
      formData.append("email", inputs.email);
      formData.append("bio", inputs.bio);
      if (inputs.password) formData.append("password", inputs.password);
      if (selectedFile) formData.append("profilePic", selectedFile);

      const res = await fetch(`/api/users/update/${user._id}`, {
        method: "PUT",
        body: formData, // Use FormData for file + input fields
      });
      
      const data = await res.json(); // updated user object
      
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      showToast("Success", "Profile updated successfully", "success");
      setUser(data);
      localStorage.setItem("user-spools", JSON.stringify(data));

    } catch (error) {
      console.error("Update Profile Error:", error);
      showToast("Error", "An unexpected error occurred. Please try again later.", "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex justify-center items-center px-4 py-8">
      <div className="grid gap-8 max-w-3xl w-full bg-gradient-to-r from-gray-200 to-gray-600 rounded-3xl">
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <section id="update-profile">
            <div className="border-8 border-transparent rounded-xl bg-white dark:bg-zinc-900 shadow-xl p-6 sm:p-8 md:p-10 m-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center cursor-default dark:text-gray-300 text-gray-900 mb-6">
                Edit Profile
              </h1>

              {/* User Avatar */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="flex justify-center">
                  <img
                    className="rounded-full w-28 h-28 sm:w-32 sm:h-32 shadow-md"
                    src={imgUrl || user.profilePic || "defaultdp.png"}
                    alt="User Avatar"
                  />
                </div>
                <button
                  className="w-full sm:w-auto bg-gradient-to-r from-gray-400 to-gray-700 text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg"
                  onClick={() => fileRef.current.click()}
                  type="button"
                >
                  Change Avatar
                </button>
                <input
                  type="file"
                  hidden
                  ref={fileRef}
                  onChange={handleImageChange}
                />
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
                  placeholder="John Doe"
                  value={inputs.name}
                  onChange={(e) =>
                    setInputs({ ...inputs, name: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-500 transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Username */}
              <div className="mt-4">
                <label
                  htmlFor="username"
                  className="block mb-2 text-base sm:text-lg dark:text-gray-300"
                >
                  User Name
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={inputs.username}
                  onChange={(e) =>
                    setInputs({ ...inputs, username: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-500 transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Email */}
              <div className="mt-4">
                <label
                  htmlFor="email"
                  className="block mb-2 text-base sm:text-lg dark:text-gray-300"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={inputs.email}
                  onChange={(e) =>
                    setInputs({ ...inputs, email: e.target.value })
                  }
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
                  placeholder="Your bio."
                  value={inputs.bio}
                  onChange={(e) =>
                    setInputs({ ...inputs, bio: e.target.value })
                  }
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
                  value={inputs.password}
                  onChange={(e) =>
                    setInputs({ ...inputs, password: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg shadow-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-500 transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col justify-between sm:flex-row gap-4 mt-6">
                <button
                  className="w-full sm:w-auto bg-gray-300 dark:bg-gray-500 dark:text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg"
                  type="button"
                  onClick={() => {
                    setInputs({
                      name: user.name || "",
                      username: user.username || "",
                      email: user.email || "",
                      bio: user.bio || "",
                      password: "",
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  className="w-full sm:w-auto bg-gradient-to-r from-gray-400 to-gray-700 text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg"
                  type="submit"
                  disabled={updating}
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
