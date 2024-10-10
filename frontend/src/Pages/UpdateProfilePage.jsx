import { useRef, useState } from "react";
import userAtom from "../atoms/userAtom";
import { useRecoilState } from "recoil";
import useShowToast from "../hooks/useShowToast";
import usePreviewImg from "../hooks/usePreviewImg";

const UpdateProfilePage = () => {
  const [user, setUser] = useRecoilState(userAtom);
  const [inputs, setInputs] = useState({
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    password: "",
    confirmPassword: "",
  });
  const fileRef = useRef(null);
  const [updating, setUpdating] = useState(false);

  const showToast = useShowToast();
  const { handleImageChange, imgUrl, selectedFile } = usePreviewImg();

  // Helper to reset form to initial values
  const resetForm = () => {
    setInputs({
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      password: "",
      confirmPassword: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (updating) return;

    // Basic validation
    if (!inputs.email.includes("@")) {
      showToast("Error", "Please enter a valid email address.", "error");
      return;
    }
    if (inputs.username.length < 3) {
      showToast(
        "Error",
        "Username must be at least 3 characters long.",
        "error"
      );
      return;
    }
    if (inputs.password && inputs.password.length < 6) {
      showToast(
        "Error",
        "Password must be at least 6 characters long.",
        "error"
      );
      return;
    }
    if (inputs.password !== inputs.confirmPassword) {
      showToast("Error", "Passwords do not match.", "error");
      return;
    }

    setUpdating(true);

    try {
      // Prepare form data for multipart/form-data request
      const formData = new FormData();
      Object.entries(inputs).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      if (selectedFile) formData.append("profilePic", selectedFile);

      const res = await fetch(`/api/users/update/${user._id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      showToast("Success", "Profile updated successfully", "success");
      setUser(data);
      localStorage.setItem("user-spools", JSON.stringify(data));

      resetForm();
    } catch (error) {
      console.error("Update Profile Error:", error);
      showToast(
        "Error",
        error.message ||
          "An unexpected error occurred. Please try again later.",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex justify-center items-center px-4 py-8">
      <div className="grid gap-8 max-w-3xl w-full bg-gradient-to-r from-gray-300 to-gray-600 rounded-3xl">
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <section id="update-profile">
            <div className="border-8 border-transparent rounded-xl bg-white dark:bg-zinc-900 shadow-xl p-6 sm:p-8 md:p-10 m-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center cursor-default dark:text-white text-gray-900 mb-6">
                Edit Profile
              </h1>

              {/* User Avatar */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <img
                  className="rounded-full object-cover w-28 h-28 sm:w-32 sm:h-32 shadow-md"
                  src={imgUrl || user.profilePic || "defaultdp.png"}
                  alt="User Avatar"
                />
                <button
                  className="w-full md:text-base text-sm font-semibold sm:w-auto bg-gradient-to-r from-electricBlue to-softPurple text-white px-6 py-3 rounded-full hover:scale-105 shadow-xl transition-all duration-300 hover:shadow-electricBlue dark:hover:shadow-softPurple"
                  onClick={() => fileRef.current.click()}
                  type="button"
                >
                  Change Picture
                </button>
                <input
                  type="file"
                  hidden
                  ref={fileRef}
                  onChange={handleImageChange}
                />
              </div>

              {/* Input fields */}
              {[
                {
                  id: "fullName",
                  label: "Full Name",
                  value: inputs.name,
                  placeholder: "John Doe",
                  type: "text",
                },
                {
                  id: "username",
                  label: "Username",
                  value: inputs.username,
                  placeholder: "johndoe",
                  type: "text",
                },
                {
                  id: "email",
                  label: "Email Address",
                  value: inputs.email,
                  placeholder: "your-email@example.com",
                  type: "email",
                },
                {
                  id: "bio",
                  label: "Bio",
                  value: inputs.bio,
                  placeholder: "Your bio.",
                  type: "text",
                },
                {
                  id: "password",
                  label: "Password",
                  value: inputs.password,
                  placeholder: "Enter new password",
                  type: "password",
                },
                {
                  id: "confirmPassword",
                  label: "Confirm Password",
                  value: inputs.confirmPassword,
                  placeholder: "Confirm new password",
                  type: "password",
                },
              ].map(({ id, label, value, placeholder, type }) => (
                <div key={id} className="mt-4">
                  <label
                    htmlFor={id}
                    className="block mb-2 md:text-base text-sm dark:text-white"
                  >
                    {label}
                  </label>
                  <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) =>
                      setInputs({ ...inputs, [id]: e.target.value })
                    }
                    className="w-full p-3 md:text-base text-sm border rounded-full shadow-md dark:bg-gray-700 dark:text-white dark:border-gray-700 border-white focus:ring-2 focus:ring-gray-500 transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}

              {/* Action Buttons */}
              <div className="mt-8 flex justify-between">
                <button
                  className="bg-gradient-to-r from-red-400 to-red-500 font-semibold text-white md:text-base text-sm md:px-6 md:py-3 px-4 py-2 rounded-full hover:scale-105 shadow-xl transition-all duration-300 hover:shadow-softRed"
                  type="button"
                  onClick={resetForm}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  className={`bg-gradient-to-r from-electricBlue to-softPurple font-semibold text-white md:text-base text-sm md:px-6 md:py-3 px-4 py-2 rounded-full hover:scale-105 shadow-xl transition-all duration-300 hover:shadow-electricBlue dark:hover:shadow-softPurple ${
                    updating ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  type="submit"
                  disabled={updating}
                >
                  {updating ? (
                    <svg
                      className="animate-spin h-5 w-5 text-gray-700 dark:text-gray-200"
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
                  ) : (
                    "Update Profile"
                  )}
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfilePage;
