import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow } from "date-fns";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import Actions from "./Actions";
import { MdDelete } from "react-icons/md";

const Post = ({ post, postedBy }) => {
  const [user, setUser] = useState(null);
  const showToast = useShowToast();
  const currentUser = useRecoilValue(userAtom);
  const [posts, setPosts] = useRecoilState(postsAtom);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      if (!postedBy) {
        showToast("Error", "User not found", "error");
        return;
      }

      try {
        const res = await fetch(`/api/users/profile/${postedBy}`);
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setUser(data);
      } catch (error) {
        showToast("Error", error.message, "error");
        setUser(null);
      }
    };

    getUser();
  }, [postedBy, showToast]);

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

  if (!user) return null; // Ensure user is loaded before rendering

  return (
    <Link to={`/${user.username}/post/${post?._id}`}>
      <div className="flex gap-4 mb-5 py-6 bg-white dark:bg-ebony border-b border-light-gray dark:border-dark-gray">
        <div className="flex flex-col items-center py-2">
          <img
            className="w-12 h-12 rounded-full object-cover cursor-pointer"
            src={user.profilePic || "defaultdp.png"}
            alt={user.name}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/${user.username}`);
            }}
          />
          <div className="w-px h-full bg-gray-400 dark:bg-gray-400 my-2 mb-7"></div>
          <div className="relative w-full">
            {post.replies.length === 0 && (
              <p className="text-center text-ebony dark:text-white">🥱</p>
            )}
            {post.replies[0] && (
              <img
                className="w-6 h-6 rounded-full object-cover absolute top-0 left-3"
                src={post.replies[0].userProfilePic || "defaultdp.png"}
                alt="reply avatar 1"
              />
            )}
            {post.replies[1] && (
              <img
                className="w-6 h-6 rounded-full object-cover absolute bottom-0 right-7"
                src={post.replies[1].userProfilePic || "defaultdp.png"}
                alt="reply avatar 2"
              />
            )}
            {post.replies[2] && (
              <img
                className="w-6 h-6 rounded-full object-cover absolute bottom-0 left-7"
                src={post.replies[2].userProfilePic || "defaultdp.png"}
                alt="reply avatar 3"
              />
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <p
                className="md:text-sm text-xs font-bold text-ebony dark:text-white cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/${user.username}`);
                }}
              >
                {user.username}
              </p>
              <img
                src="/verified.png"
                className="md:w-4 md:h-4 w-3 h-3 ml-1 object-cover"
                alt="verified"
              />
            </div>
            <div className="flex gap-3 items-center">
              <span className="md:text-xs text-xs font-semibold text-gray-500 dark:text-gray-300">
                {formatDistanceToNow(new Date(post.createdAt))} ago
              </span>
              {currentUser?._id === user._id && (
                <button
                  onClick={handleDeletePost}
                  className="text-gray-500 dark:text-white hover:text-red-400 dark:hover:text-red-400 cursor-pointer"
                >
                  <MdDelete className="md:text-2xl text-lg" />
                </button>
              )}
            </div>
          </div>

          <p className="md:text-base text-sm text-ebony dark:text-white">
            {post.text}
          </p>
          {post.img && (
            <div className="rounded-lg overflow-hidden border border-light-gray dark:border-dark-gray">
              <img src={post.img} className="w-full" alt="post content" />
            </div>
          )}

          <div className="flex gap-3 my-2">
            <Actions post={post} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Post;
