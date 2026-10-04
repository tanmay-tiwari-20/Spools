import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import Post from "../Components/Post";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import userAtom from "../atoms/userAtom";
import authScreenAtom from "../atoms/authAtom";
import SuggestedUsers from "../Components/SuggestedUsers";
import CreatePostInline from "../Components/CreatePostInline";
import { Link, useSearchParams } from "react-router-dom";
import {
  Box,
  Flex,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
} from "@chakra-ui/react";

const HomePage = () => {
  const [posts, setPosts] = useRecoilState(postsAtom);
  const user = useRecoilValue(userAtom);
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const feedType = !user || searchParams.get("feed") === "explore" ? "explore" : "following";
  const showToast = useShowToast();

  useEffect(() => {
    const getFeedPosts = async () => {
      setLoading(true);
      setPosts([]); // Ensure posts are reset to an empty array before fetching
      try {
        const publicPreview = !user;
        const res = await fetch(`/api/posts/feed?type=${feedType}${publicPreview ? "&limit=3" : ""}`);
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
    window.addEventListener("spools:account-restored", getFeedPosts);
    getFeedPosts();
    return () => window.removeEventListener("spools:account-restored", getFeedPosts);
  }, [showToast, setPosts, feedType, user?._id]);

  return (
    <div className="flex min-w-0 flex-col md:flex-row gap-5 lg:gap-8 items-start pt-2">
      <div className="w-full min-w-0 md:flex-1">
        {!user ? (
          <section className="mb-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/70 sm:p-6">
            <h1 className="text-xl font-bold text-zinc-950 dark:text-white">Welcome to Spools</h1>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">Sign up or log in to join the conversation.</p>
            <div className="mt-4 flex gap-2">
              <Link to="/auth" onClick={() => setAuthScreen("signup")} className="inline-flex min-h-10 items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">Sign up</Link>
              <Link to="/auth" onClick={() => setAuthScreen("login")} className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">Log in</Link>
            </div>
          </section>
        ) : (
          <>
            <div className="mb-4 flex w-fit gap-2 rounded-full border border-zinc-200/70 bg-zinc-100 p-1 dark:border-zinc-800/80 dark:bg-zinc-900/70">
              {[{ id: "following", label: "Following" }, { id: "explore", label: "Explore" }].map((tab) => (
                <button key={tab.id} type="button" onClick={() => setSearchParams(tab.id === "following" ? {} : { feed: tab.id })}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${feedType === tab.id ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <CreatePostInline />
          </>
        )}

        {!user && <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Suggested spools</h2>}

        {loading ? (
          <Flex flexDir="column" gap={5}>
            {[...Array(3)].map((_, i) => (
              <Flex
                gap={4}
                py={5}
                key={i}
                className="border-b border-zinc-100 dark:border-zinc-800/80"
              >
                <Flex flexDir="column" alignItems="center">
                  <SkeletonCircle size="10" />
                  <Box w="1px" h="full" bg="gray.300" my={2}></Box>
                </Flex>
                <Flex flex={1} flexDir="column" gap={3}>
                  <Skeleton height="16px" width="130px" borderRadius="md" />
                  <SkeletonText
                    noOfLines={2}
                    spacing="3"
                    skeletonHeight="14px"
                  />
                  <Skeleton height="220px" borderRadius="xl" mt={2} />
                </Flex>
              </Flex>
            ))}
          </Flex>
        ) : (
          <>
            {posts.length === 0 ? (
              <div className="py-10 text-center bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-8 flex flex-col items-center">
                <img
                  src="/dark-mode.svg"
                  alt="Spools Logo"
                  className="w-12 h-12 object-contain opacity-50 dark:hidden mb-3"
                />
                <img
                  src="/light-mode.svg"
                  alt="Spools Logo"
                  className="w-12 h-12 object-contain opacity-50 hidden dark:block mb-3"
                />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                  Welcome to Spools!
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
                  {user ? "Create your first spool above, or discover interesting people to follow." : "There are no suggested spools to show yet. Sign up to start the conversation."}
                </p>
                {user && <SuggestedUsers />}
              </div>
            ) : (
              <div className="space-y-1">
                {posts.map((post) => (
                  <Post
                    key={post._id}
                    post={post}
                    postedBy={post.postedBy}
                    readOnly={!user}
                    showFollowButton={Boolean(user && feedType === "explore")}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {user && <div className="hidden w-[260px] shrink-0 sticky top-20 md:block lg:w-[300px]"><SuggestedUsers /></div>}
    </div>
  );
};

export default HomePage;
