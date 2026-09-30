import { useRef, useState } from "react";
import { useRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import usePreviewImg from "../hooks/usePreviewImg";
import useShowToast from "../hooks/useShowToast";
import { useNavigate } from "react-router-dom";
import { BsCamera } from "react-icons/bs";

export default function UpdateProfilePage() {
  const [user, setUser] = useRecoilState(userAtom);
  const [inputs, setInputs] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    bio: user?.bio || "",
    password: "",
  });
  const fileRef = useRef(null);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const showToast = useShowToast();
  const { handleImageChange, imgUrl } = usePreviewImg();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/users/update/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...inputs, profilePic: imgUrl || user.profilePic }),
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      showToast("Success", "Profile updated successfully", "success");
      setUser(data);
      localStorage.setItem("user-spools", JSON.stringify(data));
      navigate(`/${data.username}`);
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-zinc-900/90 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-xl backdrop-blur-md">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mb-6 text-center">
          Edit Profile
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative group cursor-pointer" onClick={() => fileRef.current.click()}>
              <img
                className="rounded-full object-cover w-24 h-24 sm:w-28 sm:h-28 ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:opacity-80 transition-opacity"
                src={imgUrl || user?.profilePic || "/defaultdp.png"}
                alt="Avatar"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white">
                <BsCamera size={22} />
              </div>
            </div>

            <div className="text-center sm:text-left">
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="px-4 py-2 text-xs font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Change Photo
              </button>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                Recommended square JPG, PNG or WEBP
              </p>
            </div>

            <input
              type="file"
              hidden
              ref={fileRef}
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {/* Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={inputs.name}
                onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
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
                type="text"
                value={inputs.username}
                onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={inputs.email}
              onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              placeholder="Tell the world about yourself..."
              value={inputs.bio}
              onChange={(e) => setInputs({ ...inputs, bio: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
            />
          </div>

          {/* New Password (Optional) */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              New Password (leave blank to keep current)
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={inputs.password}
              onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 text-sm font-semibold rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updating}
              className={`px-6 py-2.5 text-sm font-semibold rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all duration-200 ${
                updating ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
