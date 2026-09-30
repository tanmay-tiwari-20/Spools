import useShowToast from "../hooks/useShowToast";
import useLogout from "../hooks/useLogout";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";

export const SettingsPage = () => {
  const showToast = useShowToast();
  const logout = useLogout();
  const user = useRecoilValue(userAtom);

  const freezeAccount = async () => {
    if (!window.confirm("Are you sure you want to freeze your account?"))
      return;

    try {
      const res = await fetch("/api/users/freeze", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.error) {
        return showToast("Error", data.error, "error");
      }
      if (data.success) {
        await logout();
        showToast("Success", "Your account has been frozen", "success");
      }
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-6">
        Settings
      </h1>

      <div className="bg-white dark:bg-zinc-900/70 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-6">
        {user && (
          <div className="flex items-center gap-3 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <img
              src={user.profilePic || "/defaultdp.png"}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
            />
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">{user.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">@{user.username}</p>
            </div>
          </div>
        )}

        <div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1">
            Freeze Account
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
            Freezing your account will hide your profile and spools until you log back in.
          </p>
          <button
            className="px-5 py-2 text-xs font-semibold rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 transition-colors"
            onClick={freezeAccount}
          >
            Freeze Account
          </button>
        </div>
      </div>
    </div>
  );
};
