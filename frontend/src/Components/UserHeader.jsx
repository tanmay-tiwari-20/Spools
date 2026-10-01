import {
  Box,
  VStack,
} from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link, Link as RouterLink } from "react-router-dom";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { motion } from "framer-motion";
import { MdOutlineSettings } from "react-icons/md";
import { FiLock, FiShare2 } from "react-icons/fi";
import ShareProfileModal from "./ShareProfileModal";
import FollowPeopleModal from "./FollowPeopleModal";

const UserHeader = ({ user, activeTab = "spools", setActiveTab }) => {
  const showToast = useShowToast();
  const currentUser = useRecoilValue(userAtom); // logged in user
  const [following, setFollowing] = useState(Boolean(user?.isFollowing));
  const [requestPending, setRequestPending] = useState(Boolean(user?.followRequestPending));
  const [followersCount, setFollowersCount] = useState(user?.followersCount ?? user?.followers?.length ?? 0);
  const [followingCount, setFollowingCount] = useState(user?.followingCount ?? user?.following?.length ?? 0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(user?.pendingFollowRequestsCount || 0);
  const [updating, setUpdating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [peopleList, setPeopleList] = useState(null);

  useEffect(() => {
    setFollowing(Boolean(user?.isFollowing));
    setRequestPending(Boolean(user?.followRequestPending));
    setFollowersCount(user?.followersCount ?? user?.followers?.length ?? 0);
    setFollowingCount(user?.followingCount ?? user?.following?.length ?? 0);
    setPendingRequestsCount(user?.pendingFollowRequestsCount || 0);
  }, [user?._id, user?.isFollowing, user?.followRequestPending, user?.followersCount, user?.followingCount, user?.followers?.length, user?.following?.length, user?.pendingFollowRequestsCount]);

  const handleShareProfile = async () => {
    const hasProfilePicture = Boolean(user.profilePic);
    const profileTitle = hasProfilePicture && user.name
      ? `${user.name} (@${user.username}) • Spools`
      : `@${user.username} • Spools`;
    const profileUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${user.username}`
      : `https://spools.net/${user.username}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: profileTitle,
          text: hasProfilePicture && user.name
            ? `Check out ${user.name}'s profile on Spools:`
            : `Check out @${user.username} on Spools:`,
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
      const nextFollowing = data.status === "following";
      const nextRequested = data.status === "requested";
      if (nextFollowing && !following) setFollowersCount((count) => count + 1);
      if (!nextFollowing && following) setFollowersCount((count) => Math.max(0, count - 1));
      setFollowing(nextFollowing);
      setRequestPending(nextRequested);
      showToast("Success", data.message || (nextRequested ? "Follow request sent" : nextFollowing ? `Followed ${user.name}` : `Unfollowed ${user.name}`), "success");
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <VStack gap={4} alignItems={"start"} className="w-full">
      {/* Header section */}
      <div className="flex justify-between w-full min-w-0 items-center gap-3">
        <div className="min-w-0">
          <h1 className="break-words font-bold lg:text-4xl text-2xl mb-2">{user.name}</h1>
          <div className="gap-2 flex items-center">
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300">
              @{user.username}
            </p>
            <p className="rounded-full select-none px-2 py-1 text-xs bg-gray-300 dark:bg-softPurple text-gray-700 dark:text-gray-200 font-semibold">
              spools.net
            </p>
            {user.isPrivate && <p className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"><FiLock size={11} /> Private</p>}
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
      <p className="break-words text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-300">
        {user.bio}
      </p>

      {/* Action buttons (Update Profile / Share Profile / Follow) */}
      {currentUser?._id === user._id ? (
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            className="flex justify-center items-center rounded-full shadow-sm bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 px-5 py-1.5 font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-95"
            onClick={handleFollowUnfollow}
            disabled={updating}
          >
            {updating ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : following ? (
              "Unfollow"
            ) : requestPending ? (
              "Cancel request"
            ) : user.isPrivate ? (
              "Request to follow"
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
      <div className="flex flex-wrap justify-between w-full mt-2 items-center gap-2">
        <div className="gap-1.5 sm:gap-2 flex flex-wrap items-center min-w-0">
          <button type="button" disabled={!user.canViewContent} onClick={() => setPeopleList("followers")} className="text-sm text-gray-600 dark:text-gray-300 font-semibold hover:text-zinc-950 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-60">{followersCount} followers</button>
          <div className="bg-gray-600 dark:bg-gray-400 w-1 h-1 rounded-full" />
          <button type="button" disabled={!user.canViewContent} onClick={() => setPeopleList("following")} className="text-sm text-gray-600 dark:text-gray-300 font-semibold hover:text-zinc-950 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-60">{followingCount} following</button>
          {!user.canViewContent && <span className="text-[11px] text-zinc-400">Lists are private</span>}
          {currentUser?._id === user._id && user.isPrivate && pendingRequestsCount > 0 && <button type="button" onClick={() => setPeopleList("requests")} className="ml-1 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-200 dark:hover:bg-indigo-900">{pendingRequestsCount} follow {pendingRequestsCount === 1 ? "request" : "requests"}</button>}
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
      <FollowPeopleModal
        isOpen={Boolean(peopleList)}
        onClose={() => setPeopleList(null)}
        user={user}
        type={peopleList}
        onRequestResolved={(approved) => {
          setPendingRequestsCount((count) => Math.max(0, count - 1));
          if (approved) setFollowersCount((count) => count + 1);
        }}
      />
    </VStack>
  );
};

export default UserHeader;
