import useShowToast from "../hooks/useShowToast";
import useLogout from "../hooks/useLogout";

export const SettingsPage = () => {
  const showToast = useShowToast();
  const logout = useLogout();

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
    <div className="flex flex-col items-center p-6 bg-white dark:bg-ebony rounded-lg">
      <p className="my-2 font-bold text-lg text-gray-800 dark:text-white">
        Freeze Your Account
      </p>
      <p className="my-2 text-gray-600 dark:text-gray-300">
        You can unfreeze your account anytime by logging in.
      </p>
      <button
        size={"sm"}
        className="mt-4 bg-red-500 text-white hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600 px-2 py-1 rounded-full"
        onClick={freezeAccount}
      >
        Freeze
      </button>
    </div>
  );
};
