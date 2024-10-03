import { useRef, useState } from "react";
import { BsFillImageFill } from "react-icons/bs";
import { AiOutlineClose } from "react-icons/ai";
import usePreviewImg from "../hooks/usePreviewImg";
import userAtom from "../atoms/userAtom";
import { useRecoilValue, useRecoilState } from "recoil"; // Import useRecoilState
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";
import { useParams } from "react-router-dom";

const MAX_CHAR = 500;

const CreatePost = () => {
  const user = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const [isOpen, setIsOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
  const imageRef = useRef(null);
  const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useRecoilState(postsAtom); // Use Recoil state
  const { username } = useParams();

  const handleTextChange = (e) => {
    const inputText = e.target.value;

    if (inputText.length > MAX_CHAR) {
      const truncatedText = inputText.slice(0, MAX_CHAR);
      setPostText(truncatedText);
      setRemainingChar(0);
    } else {
      setPostText(inputText);
      setRemainingChar(MAX_CHAR - inputText.length);
    }
  };

  const handleCreatePost = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postedBy: user._id,
          text: postText,
          img: imgUrl,
        }),
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      showToast("Success", "Post created successfully!", "success");
      if (username === user.username) {
        setPosts([data, ...posts]); // Prepend new post to the existing posts
      }
      closeModal();
      setPostText("");
      setImgUrl("");
    } catch (error) {
      showToast("Error", error.message || "Post creation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {/* Create Post Button */}
      <button
        className="fixed bottom-7 right-7 flex items-center justify-center gap-2 px-2 py-2 md:px-5 md:py-2 text-ebony bg-gray-300 rounded-full hover:bg-zinc-100 dark:bg-softPurple dark:text-white dark:hover:bg-softPurple/90 focus:ring-8 focus:ring-zinc-300/50 dark:focus:ring-softPurple/50 shadow-xl transition-all duration-300 hover:shadow-electricBlue dark:hover:shadow-softPurple"
        onClick={openModal}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 4.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 1 1 0 1.5H12.75v6.75a.75.75 0 0 1-1.5 0V13.75H4.5a.75.75 0 0 1 0-1.5h6.75V5.5a.75.75 0 0 1 .75-.75z" />
        </svg>
        <span className="hidden md:block">Post</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-ebony p-6 rounded-lg shadow-xl w-full max-w-lg mx-4 sm:mx-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Post
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <AiOutlineClose size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <textarea
                placeholder="What's on your mind?"
                value={postText}
                onChange={handleTextChange}
                className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                rows={4}
              />

              {/* Remaining Characters */}
              <p className="text-right text-xs text-gray-500 dark:text-gray-400">
                {remainingChar}/{MAX_CHAR}
              </p>

              {/* Image Upload */}
              <input
                type="file"
                ref={imageRef}
                hidden
                onChange={handleImageChange}
              />
              <div
                className="flex items-center gap-2 text-gray-500 dark:text-gray-300 cursor-pointer"
                onClick={() => imageRef.current.click()}
              >
                <BsFillImageFill size={24} />
                <span>Add an image</span>
              </div>

              {/* Image Preview */}
              {imgUrl && (
                <div className="relative">
                  <img
                    src={imgUrl}
                    alt="Preview"
                    className="w-full rounded-md"
                  />
                  <button
                    onClick={() => setImgUrl("")}
                    className="absolute top-2 right-2 text-white bg-gray-800 rounded-full p-1"
                  >
                    <AiOutlineClose size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                className="px-4 py-2 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 text-white rounded-full bg-gradient-to-r from-electricBlue to-softPurple hover:scale-105 shadow-xl transition-all duration-300 hover:shadow-electricBlue dark:hover:shadow-softPurple ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleCreatePost}
                disabled={loading}
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreatePost;
