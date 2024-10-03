import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import useGetUserProfile from "../hooks/useGetUserProfile";
import useShowToast from "../hooks/useShowToast";
import Actions from "../Components/Actions";
import Comment from "../components/Comment";

const PostPage = () => {
  const { user, loading } = useGetUserProfile();
  const [posts, setPosts] = useRecoilState(postsAtom);
  const showToast = useShowToast();
  const { pid } = useParams();
  const currentUser = useRecoilValue(userAtom);
  const navigate = useNavigate();

  const currentPost = posts[0];

  useEffect(() => {
    const getPost = async () => {
      setPosts([]);
      try {
        const res = await fetch(`/api/posts/${pid}`);
        const data = await res.json();
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
      navigate(`/${user.username}`);
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  if (!user && loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-16 h-16 rounded-full animate-spin bg-gradient-to-r from-[#0095f6] to-[#9b51e0] border-4 border-transparent">
          {/* Inner spinner with a gradient background */}
          <div className="absolute top-0 left-0 w-full h-full rounded-full opacity-70"></div>
        </div>
      </div>
    );
  }

  if (!currentPost) return null;

  return (
    <>
      <div className="flex">
        <div className="flex w-full items-center gap-3">
          <img
            src={user.profilePic}
            alt={user.username}
            className="w-10 h-10 object-cover rounded-full"
          />
          <div className="flex items-center">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {user.username}
            </h2>
            <img src="/verified.png" alt="Verified" className="w-4 h-4 ml-4" />
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-xs w-36 text-right text-gray-500">
            {formatDistanceToNow(new Date(currentPost.createdAt))} ago
          </span>

          {currentUser?._id === user._id && (
            <button
              className="text-gray-600 dark:text-gray-200 cursor-pointer"
              onClick={handleDeletePost}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a1 1 0 011 1v7a1 1 0 11-2 0v-7a1 1 0 011-1zm0-5a1 1 0 100 2 1 1 0 000-2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="my-3">{currentPost.text}</p>

      {currentPost.img && (
        <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          <img src={currentPost.img} alt="Post" className="w-full" />
        </div>
      )}

      <div className="flex gap-3 my-3">
        <Actions post={currentPost} />
      </div>

      {!currentUser && (
        <>
          <hr className="my-4" />
          <div className="flex justify-between">
            <div className="flex gap-2 items-center">
              <span className="text-2xl">👋</span>
              <span className="text-gray-500 font-semibold">
                Login to like, reply and post.
              </span>
            </div>
            <button className="px-4 py-1 bg-gradient-to-r from-electricBlue to-softPurple rounded-full font-semibold text-white">
              Get
            </button>
          </div>
        </>
      )}

      <hr className="my-4" />
      {currentPost.replies.map((reply) => (
        <Comment
          key={reply._id}
          reply={reply}
          lastReply={
            reply._id ===
            currentPost.replies[currentPost.replies.length - 1]._id
          }
        />
      ))}
    </>
  );
};

export default PostPage;
