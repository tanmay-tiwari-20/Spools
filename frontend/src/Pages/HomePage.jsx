import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import Post from "../Components/Post";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";

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
    <>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-16 h-16 rounded-full animate-spin bg-gradient-to-l from-electricBlue to-softPurple border-4 border-transparent">
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
    </>
  );
};

export default HomePage;
