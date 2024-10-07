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
        setSuggestedUsers(data);
      } catch (error) {
        showToast("Error", error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    getSuggestedUsers();
  }, [showToast]);

  return (
    <div className="bg-white dark:bg-ebony px-3 py-2 rounded-3xl shadow-lg transition-colors border">
      <h2 className="mb-4 text-lg font-bold text-ebony dark:text-white">
        Suggested Users
      </h2>
      <div className="flex flex-col gap-2">
        {!loading && suggestedUsers.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No suggested users available.
          </p>
        )}
        {!loading &&
          suggestedUsers.map((user) => (
            <SuggestedUser key={user._id} user={user} />
          ))}
        {loading &&
          [0, 1, 2, 3, 4].map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            >
              {/* Avatar Skeleton */}
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600"></div>
              {/* Text Skeleton */}
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-2/3"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
              {/* Follow Button Skeleton */}
              <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;
