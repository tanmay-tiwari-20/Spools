import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import Post from "../Components/Post";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import SuggestedUsers from "../Components/SuggestedUsers";
import CreatePostInline from "../Components/CreatePostInline";
import {
  Box,
  Flex,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
} from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";

const HomePage = () => {
  const [posts, setPosts] = useRecoilState(postsAtom);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const feedType = searchParams.get("feed") === "explore" ? "explore" : "following";
  const showToast = useShowToast();

  useEffect(() => {
    const getFeedPosts = async () => {
      setLoading(true);
      setPosts([]); // Ensure posts are reset to an empty array before fetching
      try {
        const res = await fetch(`/api/posts/feed?type=${feedType}`);
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
  }, [showToast, setPosts, feedType]);

  return (
    <div className="flex min-w-0 flex-col md:flex-row gap-5 lg:gap-8 items-start pt-2">
      <div className="w-full min-w-0 md:flex-1">
        <div className="flex gap-2 mb-4 p-1 rounded-full bg-zinc-100 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800/80 w-fit">
          {[{ id: "following", label: "Following" }, { id: "explore", label: "Explore" }].map((tab) => (
            <button key={tab.id} type="button" onClick={() => setSearchParams(tab.id === "following" ? {} : { feed: tab.id })}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${feedType === tab.id ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <CreatePostInline />

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
                  Create your first spool above, or discover interesting people to follow.
                </p>
                <SuggestedUsers />
              </div>
            ) : (
              <div className="space-y-1">
                {posts.map((post) => (
                  <Post key={post._id} post={post} postedBy={post.postedBy} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="hidden md:block w-[260px] lg:w-[300px] shrink-0 sticky top-20">
        <SuggestedUsers />
      </div>
    </div>
  );
};

export default HomePage;
