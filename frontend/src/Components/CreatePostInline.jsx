import { useRef, useState } from "react";
import { BsImage } from "react-icons/bs";
import { IoCloseCircle } from "react-icons/io5";
import usePreviewImg from "../hooks/usePreviewImg";
import userAtom from "../atoms/userAtom";
import { useRecoilValue, useRecoilState } from "recoil";
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";

const MAX_CHAR = 500;

const CreatePostInline = () => {
  const user = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const [postText, setPostText] = useState("");
  const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
  const imageRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useRecoilState(postsAtom);

  if (!user) return null;

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
        }),
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      showToast("Success", "Spool created!", "success");
      setPosts([data, ...posts]);
      setPostText("");
      setImgUrl("");
    } catch (error) {
      showToast("Error", error.message || "Post creation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const remainingChar = MAX_CHAR - postText.length;

  return (
    <div className="w-full mb-6 p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm transition-all">
      <div className="flex gap-3">
        <img
          src={user.profilePic || "/defaultdp.png"}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-200/50 dark:ring-zinc-800 flex-shrink-0"
        />

        <div className="flex-1 flex flex-col">
          <textarea
            placeholder="Start a spool..."
            value={postText}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHAR) {
                setPostText(e.target.value);
              }
            }}
            rows={postText ? 3 : 2}
            className="w-full bg-transparent resize-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none text-sm md:text-base leading-relaxed"
          />

          {imgUrl && (
            <div className="relative mt-2 mb-3 max-h-80 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <img
                src={imgUrl}
                alt="Upload preview"
                className="w-full h-auto object-cover max-h-80"
              />
              <button
                type="button"
                onClick={() => setImgUrl("")}
                className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
              >
                <IoCloseCircle size={20} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
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
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Attach image"
              >
                <BsImage size={18} />
              </button>

              {postText.length > 0 && (
                <span
                  className={`text-xs font-medium ${
                    remainingChar < 50
                      ? "text-red-500"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {remainingChar}
                </span>
              )}
            </div>

            <button
              onClick={handleCreatePost}
              disabled={loading || (!postText.trim() && !imgUrl)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                postText.trim() || imgUrl
                  ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Posting</span>
                </div>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostInline;
