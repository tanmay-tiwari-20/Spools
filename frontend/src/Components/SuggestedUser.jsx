import { Link } from "react-router-dom";
import useFollowUnfollow from "../hooks/useFollowUnfollow";

const SuggestedUser = ({ user }) => {
  const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);

  return (
    <>
      <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-ebony rounded-full transition-colors">
        {/* Left side: Avatar and user info */}
        <Link to={`${user.username}`} className="flex items-center gap-3">
          <img
            src={user.profilePic || "defaultdp.png"}
            alt={`${user.username}'s profile`}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.name}
            </p>
          </div>
        </Link>

        {/* Right side: Follow/Unfollow button */}
        <button
          onClick={handleFollowUnfollow}
          disabled={updating}
          className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
            following
              ? "bg-gray-200 dark:bg-softPurple/90 text-gray-800 dark:text-white"
              : "dark:bg-softPurple text-white dark:hover:bg-softPurple/90 bg-electricBlue hover:bg-electricBlue/90"
          }`}
        >
          {following ? "Unfollow" : "Follow"}
        </button>
      </div>
    </>
  );
};

export default SuggestedUser;
