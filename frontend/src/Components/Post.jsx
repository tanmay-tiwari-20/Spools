import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow } from "date-fns";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import Actions from "./Actions";
import { MdDeleteOutline } from "react-icons/md";
import { motion } from "framer-motion";
import { FiAtSign, FiGlobe, FiUsers } from "react-icons/fi";

const replyPermissionDetails = {
  everyone: { label: "Everyone can reply", Icon: FiGlobe },
  followers: { label: "Followers can reply", Icon: FiUsers },
  mentioned: { label: "Mentioned people can reply", Icon: FiAtSign },
};

const Post = ({ post, postedBy }) => {
  const initialAuthor =
    typeof post?.postedBy === "object" && post?.postedBy !== null
      ? post.postedBy
      : null;
  const [user, setUser] = useState(initialAuthor);
  const showToast = useShowToast();
  const currentUser = useRecoilValue(userAtom);
  const [posts, setPosts] = useRecoilState(postsAtom);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof post?.postedBy === "object" && post?.postedBy !== null) {
      setUser(post.postedBy);
      return;
    }

    const userId = postedBy || post?.postedBy;
    if (!userId) return;

    const getUser = async () => {
      try {
        const res = await fetch(`/api/users/profile/${userId}`);
        const data = await res.json();
        if (data.error) return;
        setUser(data);
      } catch {
        setUser(null);
      }
    };

    getUser();
  }, [postedBy, post?.postedBy]);

  const handleDeletePost = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/posts/${post?._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      showToast("Success", "Post deleted", "success");
      setPosts(posts.filter((p) => p._id !== post._id));
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  if (!user) return null;
  const replyPermission = replyPermissionDetails[post.replyPermission] || replyPermissionDetails.everyone;
  const ReplyIcon = replyPermission.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative mb-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 sm:p-4"
    >
      <div className="flex gap-3">
        {/* Left Column: Avatar & Thread Line */}
        <div className="flex flex-col items-center">
          <img
            className="w-10 h-10 rounded-full object-cover cursor-pointer ring-1 ring-zinc-200 dark:ring-zinc-800 transition-transform hover:scale-105"
            src={user.profilePic || "/defaultdp.png"}
            alt={user.name}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/${user.username}`);
            }}
          />
          {post.replies?.length > 0 && (
            <div className="w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-800 my-2 rounded-full min-h-[30px]" />
          )}

          {/* Reply Avatars preview */}
          {post.replies?.length > 0 && (
            <div className="relative w-8 h-8 flex items-center justify-center">
              {post.replies[0] && (
                <img
                  className="w-4 h-4 rounded-full object-cover absolute top-0 left-0 ring-1 ring-white dark:ring-zinc-900"
                  src={post.replies[0].userProfilePic || "/defaultdp.png"}
                  alt="reply avatar 1"
                />
              )}
              {post.replies[1] && (
                <img
                  className="w-4 h-4 rounded-full object-cover absolute bottom-0 right-0 ring-1 ring-white dark:ring-zinc-900"
                  src={post.replies[1].userProfilePic || "/defaultdp.png"}
                  alt="reply avatar 2"
                />
              )}
            </div>
          )}
        </div>

        {/* Right Column: Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Row */}
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer truncate"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/${user.username}`);
                }}
              >
                {user.username}
              </span>
              <img
                src="/verified.png"
                className="w-3.5 h-3.5 object-contain flex-shrink-0"
                alt="verified"
              />
              <span className="text-zinc-400 dark:text-zinc-500 text-xs">·</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                {formatDistanceToNow(new Date(post.createdAt))} ago
              </span>
            </div>

            {currentUser?._id === user._id && (
              <button
                onClick={handleDeletePost}
                aria-label="Delete post"
                className="ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-950/30 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                title="Delete post"
              >
                <MdDeleteOutline size={18} />
              </button>
            )}
          </div>

          <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[10px] font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400">
            <ReplyIcon size={12} aria-hidden="true" />
            <span>{replyPermission.label}</span>
          </div>

          {/* Post Text */}
          <Link to={`/${user.username}/post/${post?._id}`} className="block">
            <p className="break-words text-sm md:text-base text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed mb-2">
              {post.text}
            </p>

            {/* Post Media */}
            {post.img && (
              <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 my-2 max-h-[460px] bg-black/5 dark:bg-black/30">
                <img
                  src={post.img}
                  className="w-full h-auto object-cover max-h-[460px]"
                  alt="Post content"
                  loading="lazy"
                />
              </div>
            )}
          </Link>

          {/* Actions Bar */}
          <Actions post={post} />
        </div>
      </div>
    </motion.div>
  );
};

export default Post;
