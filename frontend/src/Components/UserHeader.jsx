import {
  Box,
  VStack,
} from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link, Link as RouterLink } from "react-router-dom";
import { useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { motion } from "framer-motion";
import { MdOutlineSettings } from "react-icons/md";
import { FiShare2 } from "react-icons/fi";
import ShareProfileModal from "./ShareProfileModal";

const UserHeader = ({ user, activeTab = "spools", setActiveTab }) => {
  const showToast = useShowToast();
  const currentUser = useRecoilValue(userAtom); // logged in user
  const [following, setFollowing] = useState(
    Array.isArray(user?.followers) && currentUser?._id
      ? user.followers.includes(currentUser._id)
      : false
  );
  const [updating, setUpdating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShareProfile = async () => {
    const profileUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${user.username}`
      : `https://spools.net/${user.username}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${user.name} (@${user.username}) • Spools`,
          text: `Check out ${user.name}'s profile on Spools:`,
          url: profileUrl,
        });
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          setShowShareModal(true);
        }
        return;
      }
    }
    setShowShareModal(true);
  };

  const handleFollowUnfollow = async () => {
    if (!currentUser) {
      showToast(
        "Error",
        "You need to be logged in to follow or unfollow users",
        "error"
      );
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/users/follow/${user._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      if (following) {
        showToast("Success", `Unfollowed ${user.name}`, "success");
        if (Array.isArray(user.followers)) {
          user.followers = user.followers.filter(
            (id) => id !== currentUser?._id
          );
        }
      } else {
        showToast("Success", `Followed ${user.name}`, "success");
        if (Array.isArray(user.followers)) {
          user.followers.push(currentUser?._id);
        }
      }
      setFollowing(!following);
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <VStack gap={4} alignItems={"start"} className="w-full">
      {/* Header section */}
      <div className="flex justify-between w-full items-center">
        <div>
          <h1 className="font-bold lg:text-4xl text-2xl mb-2">{user.name}</h1>
          <div className="gap-2 flex items-center">
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300">
              @{user.username}
            </p>
            <p className="rounded-full select-none px-2 py-1 text-xs bg-gray-300 dark:bg-softPurple text-gray-700 dark:text-gray-200 font-semibold">
              spools.net
            </p>
          </div>
        </div>
        <Box>
          <img
            src={user.profilePic ? user.profilePic : "defaultdp.png"}
            alt="avatar"
            className="rounded-full object-cover lg:w-24 lg:h-24 w-20 h-20"
          />
        </Box>
      </div>

      {/* Bio section */}
      <p className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-300">
        {user.bio}
      </p>

      {/* Action buttons (Update Profile / Share Profile / Follow) */}
      {currentUser?._id === user._id ? (
        <div className="flex items-center gap-2.5">
          <Link as={RouterLink} to="/update">
            <button className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 px-5 py-1.5 font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm active:scale-95 cursor-pointer">
              Update Profile
            </button>
          </Link>
          <button
            onClick={handleShareProfile}
            className="flex items-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-4 py-1.5 font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer"
            title="Share Profile"
          >
            <FiShare2 size={14} />
            <span>Share Profile</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <button
            className="flex justify-center items-center rounded-full shadow-sm bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 px-5 py-1.5 font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-95"
            onClick={handleFollowUnfollow}
            disabled={updating}
          >
            {updating ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : following ? (
              "Unfollow"
            ) : (
              "Follow"
            )}
          </button>
          <button
            onClick={handleShareProfile}
            className="flex items-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-4 py-1.5 font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer"
            title="Share Profile"
          >
            <FiShare2 size={14} />
            <span>Share</span>
          </button>
        </div>
      )}

      {/* Followers and action link section */}
      <div className="flex justify-between w-full mt-2 items-center">
        <div className="gap-2 flex items-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">
            {user.followers.length} followers
          </p>
          <div className="bg-gray-600 dark:bg-gray-400 w-1 h-1 rounded-full"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">
            {user.following.length} following
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Share Profile button */}
          <button
            onClick={handleShareProfile}
            className="p-2 rounded-full text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Share Profile"
            aria-label="Share Profile"
          >
            <FiShare2 size={20} />
          </button>

          {/* Settings button (only for current user) */}
          {currentUser?._id === user._id && (
            <div className="cursor-pointer dark:text-gray-200 hover:scale-110 p-2 w-10 h-10 transition-all duration-300 ease-linear dark:hover:shadow-softPurple hover:shadow-electricBlue rounded-full flex items-center justify-center">
              <Link as={RouterLink} to={`/settings`}>
                <MdOutlineSettings size={22} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tabs section */}
      <div className="flex w-full mt-4 border-b border-gray-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab && setActiveTab("spools")}
          className={`flex-1 pb-3 text-sm md:text-base font-semibold transition-all relative ${
            activeTab === "spools"
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Spools
          {activeTab === "spools" && (
            <motion.div
              layoutId="userHeaderTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab && setActiveTab("replies")}
          className={`flex-1 pb-3 text-sm md:text-base font-semibold transition-all relative ${
            activeTab === "replies"
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Replies
          {activeTab === "replies" && (
            <motion.div
              layoutId="userHeaderTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white"
            />
          )}
        </button>
        {currentUser?._id === user._id && (
          <button
            onClick={() => setActiveTab && setActiveTab("saved")}
            className={`flex-1 pb-3 text-sm md:text-base font-semibold transition-all relative ${
              activeTab === "saved"
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            Saved
            {activeTab === "saved" && (
              <motion.div
                layoutId="userHeaderTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white"
              />
            )}
          </button>
        )}
      </div>

      {/* Share Profile Modal */}
      <ShareProfileModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
      />
    </VStack>
  );
};

export default UserHeader;
