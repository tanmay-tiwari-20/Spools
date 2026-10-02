import { useRef, useState } from "react";
import { BsImage } from "react-icons/bs";
import { AiOutlineClose } from "react-icons/ai";
import usePreviewImg from "../hooks/usePreviewImg";
import userAtom from "../atoms/userAtom";
import { useRecoilValue, useRecoilState } from "recoil";
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";
import { IoAddOutline } from "react-icons/io5";
import ReplyPermissionPicker from "./ReplyPermissionPicker";

const MAX_CHAR = 500;

const CreatePost = () => {
  const user = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const [isOpen, setIsOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [replyPermission, setReplyPermission] = useState("everyone");
  const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
  const imageRef = useRef(null);
  const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useRecoilState(postsAtom);

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
    if (!postText.trim() && !imgUrl) return;
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
          replyPermission,
        }),
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      showToast("Success", "Spool created successfully!", "success");
      setPosts([data, ...posts]);
      closeModal();
      setPostText("");
      setReplyPermission("everyone");
      setImgUrl("");
    } catch (error) {
      showToast("Error", error.message || "Post creation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setPostText("");
    setImgUrl("");
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="fixed safe-area-fab z-40 flex items-center justify-center gap-2 p-3.5 md:px-5 md:py-3 text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
        onClick={openModal}
        title="Create new spool"
      >
        <IoAddOutline className="text-xl font-bold" />
        <span className="hidden md:inline text-sm font-bold">New Spool</span>
      </button>

      {/* Modern Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-3xl shadow-2xl w-full max-w-lg max-h-[calc(100dvh-1rem)] overflow-x-hidden overflow-y-auto border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800/80 mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                New Spool
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <AiOutlineClose size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <textarea
                placeholder="What's on your mind?"
                value={postText}
                onChange={handleTextChange}
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none text-sm md:text-base border border-zinc-200 dark:border-zinc-700/80"
                rows={4}
              />

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Who can reply?</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">Choose who can join in</p>
                </div>
                <ReplyPermissionPicker value={replyPermission} onChange={setReplyPermission} className="shrink-0" />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={imageRef}
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <button
                    type="button"
                    onClick={() => imageRef.current.click()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <BsImage size={15} />
                    <span>Attach photo</span>
                  </button>
                </div>
                <span>
                  {remainingChar}/{MAX_CHAR}
                </span>
              </div>

              {/* Image Preview */}
              {imgUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-64">
                  <img
                    src={imgUrl}
                    alt="Preview"
                    className="w-full h-auto object-cover max-h-64"
                  />
                  <button
                    onClick={() => setImgUrl("")}
                    className="absolute top-2 right-2 p-1.5 text-white bg-black/70 hover:bg-black rounded-full transition-colors"
                  >
                    <AiOutlineClose size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <button
                className="px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`px-6 py-2 text-sm font-semibold rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all duration-200 ${
                  loading || (!postText.trim() && !imgUrl)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={handleCreatePost}
                disabled={loading || (!postText.trim() && !imgUrl)}
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
