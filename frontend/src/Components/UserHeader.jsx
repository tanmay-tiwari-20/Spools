import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link as RouterLink } from "react-router-dom";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { motion } from "framer-motion";
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

  const isOwnProfile = currentUser?._id === user._id;
  const followLabel = updating ? (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  ) : following ? "Following" : requestPending ? "Requested" : user.isPrivate ? "Request to follow" : "Follow";

  const tabs = [
    { id: "spools", label: "Spools" },
    { id: "replies", label: "Replies" },
    ...(isOwnProfile ? [{ id: "saved", label: "Saved" }] : []),
  ];

  return (
    <>
    <section className="w-full pb-1 pt-3 sm:pt-5">
      <div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <img
            src={user.profilePic || "/defaultdp.png"}
            alt={`${user.username}'s profile`}
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-950/70 sm:h-24 sm:w-24"
          />

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 pb-1">
            {isOwnProfile ? (
              <RouterLink to="/update" className="inline-flex min-h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:text-sm">
                Edit profile
              </RouterLink>
            ) : (
              <button
                type="button"
                onClick={handleFollowUnfollow}
                disabled={updating}
                className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-xs font-bold shadow-sm transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 sm:text-sm ${following || requestPending ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700" : "bg-indigo-600 text-white hover:bg-indigo-500"}`}
              >
                {updating ? followLabel : requestPending ? "Cancel request" : following ? "Unfollow" : user.isPrivate ? <><span className="sm:hidden">Request</span><span className="hidden sm:inline">Request to follow</span></> : "Follow"}
              </button>
            )}
            <button
              type="button"
              onClick={handleShareProfile}
              aria-label="Share profile"
              title="Share profile"
              className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <FiShare2 size={17} />
            </button>
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="max-w-full break-words text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">{user.name || user.username}</h1>
            {user.isPrivate && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"><FiLock size={11} /> Private</span>}
          </div>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">@{user.username}</p>
          {user.bio?.trim() && <p className="mt-3 max-w-2xl whitespace-pre-line break-words text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:text-[15px]">{user.bio}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <button type="button" disabled={!user.canViewContent} onClick={() => setPeopleList("followers")} className="text-sm text-zinc-600 transition hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-300 dark:hover:text-white">
              <span className="font-bold text-zinc-950 dark:text-white">{followersCount}</span> followers
            </button>
            <button type="button" disabled={!user.canViewContent} onClick={() => setPeopleList("following")} className="text-sm text-zinc-600 transition hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-300 dark:hover:text-white">
              <span className="font-bold text-zinc-950 dark:text-white">{followingCount}</span> following
            </button>
            {!user.canViewContent && <span className="text-xs text-zinc-400">Lists are private</span>}
            {isOwnProfile && user.isPrivate && pendingRequestsCount > 0 && (
              <button type="button" onClick={() => setPeopleList("requests")} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-950/70 dark:text-indigo-200 dark:hover:bg-indigo-900">
                {pendingRequestsCount} follow {pendingRequestsCount === 1 ? "request" : "requests"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex border-b border-zinc-200/80 px-1 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setActiveTab?.(tab.id)}
            className={`relative min-h-12 flex-1 px-3 text-sm font-semibold transition-colors sm:min-h-14 sm:text-[15px] ${activeTab === tab.id ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"}`}
          >
            {tab.label}
            {activeTab === tab.id && <motion.div layoutId="userHeaderTab" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
          </button>
        ))}
      </div>

    </section>
    <ShareProfileModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} user={user} />
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
    </>
  );
};

export default UserHeader;
