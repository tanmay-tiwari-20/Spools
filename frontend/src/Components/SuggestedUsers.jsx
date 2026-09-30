import { useEffect, useState } from "react";
import SuggestedUser from "./SuggestedUser";
import useShowToast from "../hooks/useShowToast";

const SuggestedUsers = () => {
  const [loading, setLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const showToast = useShowToast();

  useEffect(() => {
    const getSuggestedUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/users/suggested");
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setSuggestedUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        showToast("Error", error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    getSuggestedUsers();
  }, [showToast]);

  return (
    <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          Suggested for you
        </h2>
      </div>

      <div className="flex flex-col gap-1">
        {!loading && suggestedUsers.length === 0 && (
          <p className="text-zinc-400 text-xs text-center py-4">
            No suggestions available right now.
          </p>
        )}

        {!loading &&
          suggestedUsers.map((user) => (
            <SuggestedUser key={user._id} user={user} />
          ))}

        {loading &&
          [0, 1, 2, 3].map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2 rounded-2xl animate-pulse"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
                <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              </div>
              <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            </div>
          ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;
