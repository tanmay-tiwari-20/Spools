import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import Post from "../Components/Post";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import SuggestedUsers from "../Components/SuggestedUsers"; // Import SuggestedUsers component
import {
  Box,
  Flex,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
} from "@chakra-ui/react";

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
          <Flex flexDir="column" gap={5}>
            {[...Array(3)].map((_, i) => (
              <Flex gap={4} py={6} key={i}>
                <Flex flexDir="column" alignItems="center">
                  <SkeletonCircle size="12" />
                  <Box w="1px" h="full" bg="gray.400" my={2}></Box>
                </Flex>
                <Flex flex={1} flexDir="column" gap={2}>
                  <Skeleton height="20px" width="150px" />
                  <SkeletonText
                    mt="4"
                    noOfLines={3}
                    spacing="4"
                    skeletonHeight="20px"
                  />
                  <Skeleton height="300px" borderRadius="lg" mt={4} />
                </Flex>
              </Flex>
            ))}
          </Flex>
        ) : (
          <>
            {posts.length === 0 ? (
              <Box>
                <h1 className="text-xl font-bold mb-6 text-ebony dark:text-white">
                  Welcome! Follow some users to see their posts here.
                </h1>
                <SuggestedUsers />
              </Box>
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
