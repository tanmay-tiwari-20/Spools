import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import Post from "../Components/Post";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import SuggestedUsers from "../Components/SuggestedUsers"; // Import SuggestedUsers component

const HomePage = () => {
  const [posts, setPosts] = useRecoilState(postsAtom);
  const [loading, setLoading] = useState(true);
  const showToast = useShowToast();

  useEffect(() => {
    const getFeedPosts = async () => {
      setLoading(true);
      setPosts([]); // Ensure posts are reset to an empty array before fetching
      try {
        const res = await fetch("/api/posts/feed");
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        if (Array.isArray(data)) {
          setPosts(data); // Set posts only if data is an array
        } else {
          setPosts([]); // Default to an empty array if not an array
        }
      } catch (error) {
        showToast("Error", error.message, "error");
      } finally {
        setLoading(false);
      }
    };
    getFeedPosts();
  }, [showToast, setPosts]);

  return (
    <div className="flex flex-col md:flex-row gap-10 items-start">
      <div className="flex-[70%]">
        {loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <div className="absolute translate-x-[250%] w-16 h-16 rounded-full animate-spin bg-gradient-to-r from-[#0095f6] to-[#9b51e0] border-4 border-transparent">
              {/* Inner spinner with a gradient background */}
              <div className="absolute top-0 left-0 w-full h-full rounded-full opacity-70"></div>
            </div>
          </div>
        ) : (
          <>
            {posts.length === 0 ? (
              <h1>Login or Follow some users to see the feed.</h1>
            ) : (
              posts.map((post) => (
                <Post key={post._id} post={post} postedBy={post.postedBy} />
              ))
            )}
          </>
        )}
      </div>

      <div className="hidden md:block flex-[30%]">
        <SuggestedUsers />
      </div>
    </div>
  );
};

export default HomePage;
