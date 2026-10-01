import {
  Box,
  Button,
  Flex,
  FormControl,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";
import { motion } from "framer-motion";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";

const Actions = ({ post }) => {
  const user = useRecoilValue(userAtom);
  const [liked, setLiked] = useState(post.likes?.includes(user?._id));
  const [reposted, setReposted] = useState(
    post.reposts?.some((id) => (typeof id === "object" ? id._id : id) === user?._id)
  );
  const [isSaved, setIsSaved] = useState(
    user?.savedPosts?.some((p) => (typeof p === "object" ? p._id : p) === post._id) || false
  );

  const [posts, setPosts] = useRecoilState(postsAtom);
  const [isLiking, setIsLiking] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [reply, setReply] = useState("");

  const showToast = useShowToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLikeAndUnlike = async () => {
    if (!user) {
      return showToast("Error", "You must be logged in to like a post", "error");
    }
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch("/api/posts/like/" + post._id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.error) return showToast("Error", data.error, "error");

      if (!liked) {
        const updatedPosts = posts.map((p) => {
          if (p._id === post._id) {
            return { ...p, likes: [...(p.likes || []), user._id] };
          }
          return p;
        });
        setPosts(updatedPosts);
      } else {
        const updatedPosts = posts.map((p) => {
          if (p._id === post._id) {
            return {
              ...p,
              likes: (p.likes || []).filter((id) => id !== user._id),
            };
          }
          return p;
        });
        setPosts(updatedPosts);
      }

      setLiked(!liked);
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = async () => {
    if (!user) {
      return showToast("Error", "You must be logged in to reply to a post", "error");
    }
    if (isReplying) return;
    setIsReplying(true);
    try {
      const res = await fetch("/api/posts/reply/" + post._id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: reply }),
      });
      const data = await res.json();
      if (data.error) return showToast("Error", data.error, "error");

      const updatedPosts = posts.map((p) => {
        if (p._id === post._id) {
          return { ...p, replies: [...(p.replies || []), data] };
        }
        return p;
      });
      setPosts(updatedPosts);
      showToast("Success", "Reply posted successfully", "success");
      onClose();
      setReply("");
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsReplying(false);
    }
  };

  const handleRepost = async (e) => {
    e.preventDefault();
    if (!user) {
      return showToast("Error", "You must be logged in to repost", "error");
    }
    try {
      const res = await fetch(`/api/posts/repost/${post._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.error) return showToast("Error", data.error, "error");

      const updatedPosts = posts.map((p) => {
        if (p._id === post._id) {
          const reposts = p.reposts || [];
          const newReposts = data.reposted
            ? [...reposts, user._id]
            : reposts.filter((id) => id !== user._id);
          return { ...p, reposts: newReposts };
        }
        return p;
      });
      setPosts(updatedPosts);
      setReposted(data.reposted);
      showToast("Success", data.message, "success");
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    if (!user) {
      return showToast("Error", "You must be logged in to save posts", "error");
    }
    try {
      const res = await fetch(`/api/posts/save/${post._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.error) return showToast("Error", data.error, "error");
      setIsSaved(data.saved);
      showToast("Success", data.message, "success");
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    const authorUsername =
      typeof post.postedBy === "object"
        ? post.postedBy?.username
        : user?.username || "spools";
    const authorName = typeof post.postedBy === "object" ? post.postedBy?.name : user?.name;
    const hasPreviewImage = Boolean(post.img || (typeof post.postedBy === "object" ? post.postedBy?.profilePic : user?.profilePic));
    const postUrl = `${window.location.origin}/${authorUsername}/post/${post._id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: hasPreviewImage && authorName ? `Spool by ${authorName} (@${authorUsername}) · Spools` : `Spool by @${authorUsername} · Spools`,
          text: post.text,
          url: postUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(postUrl);
      showToast("Success", "Post link copied to clipboard!", "success");
    }
  };

  const repostsCount = post.reposts?.length || 0;

  return (
    <Flex flexDirection="column" width="100%">
      <Flex gap={{ base: 2, sm: 3 }} my={2} alignItems="center" onClick={(e) => e.preventDefault()}>
        {/* Like */}
        <motion.button
          onClick={handleLikeAndUnlike}
          aria-label={liked ? "Unlike spool" : "Like spool"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-zinc-300 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          whileTap={{ scale: 0.8 }}
          animate={{ scale: liked ? 1.15 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <svg
            aria-label="Like"
            color={liked ? "rgb(239, 68, 68)" : "currentColor"}
            fill={liked ? "rgb(239, 68, 68)" : "transparent"}
            height="19"
            role="img"
            viewBox="0 0 24 22"
            width="20"
          >
            <path
              d="M1 7.66c0 4.575 3.899 9.086 9.987 12.934.338.203.74.406 1.013.406.283 0 .686-.203 1.013-.406C19.1 16.746 23 12.234 23 7.66 23 3.736 20.245 1 16.672 1 14.603 1 12.98 1.94 12 3.352 11.042 1.952 9.408 1 7.328 1 3.766 1 1 3.736 1 7.66Z"
              stroke="currentColor"
              strokeWidth="2"
            ></path>
          </svg>
        </motion.button>

        {/* Comment */}
        <button
          onClick={onOpen}
          aria-label="Reply to spool"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <svg
            aria-label="Comment"
            height="20"
            role="img"
            viewBox="0 0 24 24"
            width="20"
          >
            <title>Comment</title>
            <path
              d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
              fill="none"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="2"
            ></path>
          </svg>
        </button>

        {/* Repost */}
        <motion.button
          onClick={handleRepost}
          whileTap={{ scale: 0.85 }}
          aria-label={reposted ? "Undo repost" : "Repost spool"}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/30 ${
            reposted ? "text-emerald-500" : "text-zinc-600 hover:text-emerald-500 dark:text-zinc-300"
          }`}
          title="Repost"
        >
          <RepostSVG />
        </motion.button>

        {/* Bookmark / Save */}
        <motion.button
          onClick={handleBookmark}
          whileTap={{ scale: 0.85 }}
          aria-label={isSaved ? "Remove saved spool" : "Save spool"}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30 ${
            isSaved
              ? "text-indigo-500 dark:text-indigo-400"
              : "text-zinc-600 dark:text-zinc-300 hover:text-indigo-500"
          }`}
          title={isSaved ? "Saved" : "Save spool"}
        >
          {isSaved ? <BsBookmarkFill size={17} /> : <BsBookmark size={17} />}
        </motion.button>

        {/* Share */}
        <button
          onClick={handleShare}
          aria-label="Share spool"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          title="Share"
        >
          <ShareSVG />
        </button>
      </Flex>

      {/* Counters */}
      <Flex gap={2} alignItems={"center"} className="text-xs text-zinc-500 dark:text-zinc-400">
        <span>{post.replies?.length || 0} replies</span>
        <Box w={1} h={1} borderRadius={"full"} bg={"zinc.500"} className="opacity-60" />
        <span>{post.likes?.length || 0} likes</span>
        {repostsCount > 0 && (
          <>
            <Box w={1} h={1} borderRadius={"full"} bg={"zinc.500"} className="opacity-60" />
            <span>{repostsCount} reposts</span>
          </>
        )}
      </Flex>

      {/* Modern Reply Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "sm", md: "md" }} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
        <ModalContent
          className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800"
          overflow="hidden"
        >
          <ModalHeader
            fontSize="lg"
            fontWeight="bold"
            className="text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800/80"
          >
            Reply to spool
          </ModalHeader>
          <ModalCloseButton className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" />
          <ModalBody py={6}>
            <FormControl>
              <Input
                placeholder="Write your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700/80 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-zinc-400"
                _placeholder={{ color: "gray.400" }}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter className="border-t border-zinc-100 dark:border-zinc-800/80">
            <Button
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-full px-6"
              size="sm"
              isLoading={isReplying}
              onClick={handleReply}
              disabled={!reply.trim()}
            >
              Reply
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Actions;

const RepostSVG = () => {
  return (
    <svg
      aria-label="Repost"
      color="currentColor"
      fill="currentColor"
      height="19"
      role="img"
      viewBox="0 0 24 24"
      width="19"
    >
      <title>Repost</title>
      <path
        fill=""
        d="M19.998 9.497a1 1 0 0 0-1 1v4.228a3.274 3.274 0 0 1-3.27 3.27h-5.313l1.791-1.787a1 1 0 0 0-1.412-1.416L7.29 18.287a1.004 1.004 0 0 0-.294.707v.001c0 .023.012.042.013.065a.923.923 0 0 0 .281.643l3.502 3.504a1 1 0 0 0 1.414-1.414l-1.797-1.798h5.318a5.276 5.276 0 0 0 5.27-5.27v-4.228a1 1 0 0 0-1-1Zm-6.41-3.496-1.795 1.795a1 1 0 1 0 1.414 1.414l3.5-3.5a1.003 1.003 0 0 0 0-1.417l-3.5-3.5a1 1 0 0 0-1.414 1.414l1.794 1.794H8.27A5.277 5.277 0 0 0 3 9.271V13.5a1 1 0 0 0 2 0V9.271a3.275 3.275 0 0 1 3.271-3.27Z"
      ></path>
    </svg>
  );
};

const ShareSVG = () => {
  return (
    <svg
      aria-label="Share"
      color="currentColor"
      fill="none"
      height="19"
      role="img"
      viewBox="0 0 24 24"
      width="19"
    >
      <title>Share</title>
      <line
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
        x1="22"
        x2="9.218"
        y1="3"
        y2="10.083"
      ></line>
      <polygon
        points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      ></polygon>
    </svg>
  );
};
