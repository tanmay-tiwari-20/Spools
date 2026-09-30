import { Link } from "react-router-dom";
import useFollowUnfollow from "../hooks/useFollowUnfollow";

const SuggestedUser = ({ user }) => {
  const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
      <Link to={`/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1">
        <img
          src={user.profilePic || "/defaultdp.png"}
          alt={user.username}
          className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700 flex-shrink-0"
        />
        <div className="truncate">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:underline truncate">
            {user.username}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {user.name}
          </p>
        </div>
      </Link>

      <button
        onClick={handleFollowUnfollow}
        disabled={updating}
        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 active:scale-95 flex-shrink-0 ${
          following
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
            : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 shadow-sm"
        }`}
      >
        {updating ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
        ) : following ? (
          "Following"
        ) : (
          "Follow"
        )}
      </button>
    </div>
  );
};

export default SuggestedUser;
