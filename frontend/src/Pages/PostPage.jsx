import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import useGetUserProfile from "../hooks/useGetUserProfile";
import useShowToast from "../hooks/useShowToast";
import Actions from "../Components/Actions";
import Comment from "../Components/Comment";
import { MdDeleteOutline } from "react-icons/md";
import { IoSend } from "react-icons/io5";
import { FiMessageCircle } from "react-icons/fi";
import { setShareMetadata } from "../utils/shareMetadata";

const PostPage = () => {
  const { user, loading } = useGetUserProfile();
  const [posts, setPosts] = useRecoilState(postsAtom);
  const showToast = useShowToast();
  const { pid } = useParams();
  const currentUser = useRecoilValue(userAtom);
  const navigate = useNavigate();

  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [postUnavailable, setPostUnavailable] = useState(false);

  const currentPost = posts[0];
  const author = useMemo(
    () => typeof currentPost?.postedBy === "object" && currentPost.postedBy !== null
      ? currentPost.postedBy
      : user || {},
    [currentPost, user]
  );

  useEffect(() => {
    if (!currentPost || !author.username) return;
    const image = currentPost.img || author.profilePic || null;
    const title = image && author.name
      ? `Spool by ${author.name} (@${author.username}) · Spools`
      : `Spool by @${author.username} · Spools`;
    const description = String(currentPost.text || `A Spool shared by @${author.username} on Spools.`).replace(/\s+/g, " ").trim().slice(0, 240);
    setShareMetadata({
      title,
      description,
      url: `${window.location.origin}/${encodeURIComponent(author.username)}/post/${currentPost._id}`,
      image,
      imageAlt: `Spool by @${author.username}`,
      type: "article",
      username: author.username,
    });
  }, [currentPost, author]);

  useEffect(() => {
    const getPost = async () => {
      setPosts([]);
      setPostUnavailable(false);
      try {
        const res = await fetch(`/api/posts/${pid}`);
        const data = await res.json();
        if (res.status === 404) {
          setPostUnavailable(true);
          return;
        }
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setPosts([data]);
      } catch (error) {
        showToast("Error", error.message, "error");
      }
    };
    getPost();
  }, [showToast, pid, setPosts]);

  if (postUnavailable) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"><FiMessageCircle size={22} /></span>
        <h1 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">This Spool isn’t available</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">It may have been removed or its account is unavailable.</p>
        <Link to="/" className="mt-4 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">Back to home</Link>
      </main>
    );
  }

  const handleDeletePost = async () => {
    try {
      if (!window.confirm("Are you sure you want to delete this post?")) return;

      const res = await fetch(`/api/posts/${currentPost._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      showToast("Success", "Post deleted", "success");
      navigate(`/${user?.username || ""}`);
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      return showToast("Error", "You must be logged in to reply", "error");
    }
    if (!replyText.trim() || isReplying) return;

    setIsReplying(true);
    try {
      const res = await fetch(`/api/posts/reply/${currentPost._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      const data = await res.json();
      if (data.error) return showToast("Error", data.error, "error");

      setPosts([{ ...currentPost, replies: [...(currentPost.replies || []), data] }]);
      setReplyText("");
      showToast("Success", "Reply added!", "success");
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsReplying(false);
    }
  };

  if (loading || !currentPost) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-900 dark:border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-2">
      {/* Author Header */}
      <div className="flex justify-between items-center mb-4">
        <Link
          to={`/${author.username}`}
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          <img
            src={author.profilePic || "/defaultdp.png"}
            alt={author.username}
            className="w-11 h-11 object-cover rounded-full ring-1 ring-zinc-200 dark:ring-zinc-800"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                {author.username}
              </span>
              <img src="/verified.png" alt="Verified" className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-zinc-400">
              {formatDistanceToNow(new Date(currentPost.createdAt))} ago
            </span>
          </div>
        </Link>

        {currentUser?._id === author._id && (
          <button
            onClick={handleDeletePost}
            className="p-2 text-zinc-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Delete post"
          >
            <MdDeleteOutline size={20} />
          </button>
        )}
      </div>

      {/* Main Post Text */}
      {currentPost.replyPermission && currentPost.replyPermission !== "everyone" && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
          {currentPost.replyPermission === "followers" ? "Only followers of the author can reply." : "Only people mentioned in this spool can reply."}
        </p>
      )}
      <p className="break-words text-base md:text-lg text-zinc-900 dark:text-zinc-100 whitespace-pre-line leading-relaxed my-3">
        {currentPost.text}
      </p>

      {/* Post Image */}
      {currentPost.img && (
        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 my-4 bg-black/5 dark:bg-black/30">
          <img
            src={currentPost.img}
            alt="Post content"
            className="w-full h-auto object-cover max-h-[500px]"
          />
        </div>
      )}

      {/* Actions */}
      <div className="py-2 border-y border-zinc-100 dark:border-zinc-800/80 my-3">
        <Actions post={currentPost} />
      </div>

      {/* Quick Reply Form */}
      {currentUser ? (
        <form onSubmit={handlePostReply} className="flex items-center gap-2 my-4">
          <img
            src={currentUser.profilePic || "/defaultdp.png"}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          />
          <input
            type="text"
            placeholder={`Reply to ${author.username || "spool"}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 py-2 px-4 text-sm bg-zinc-100 dark:bg-zinc-800/60 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <button
            type="submit"
            disabled={isReplying || !replyText.trim()}
            className="p-2.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
          >
            {isReplying ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block" />
            ) : (
              <IoSend size={15} />
            )}
          </button>
        </form>
      ) : (
        <div className="p-4 my-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Log in to join the conversation
          </span>
          <Link
            to="/auth"
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          >
            Log in
          </Link>
        </div>
      )}

      {/* Replies Thread */}
      <div className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Replies ({currentPost.replies?.length || 0})
        </h3>
        {currentPost.replies?.length === 0 ? (
          <p className="text-sm text-zinc-400 py-6 text-center">
            No replies yet. Be the first to reply!
          </p>
        ) : (
          currentPost.replies.map((reply, idx) => (
            <Comment
              key={reply._id || idx}
              reply={reply}
              lastReply={idx === currentPost.replies.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PostPage;
