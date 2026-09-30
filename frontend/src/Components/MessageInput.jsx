import { useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { BsImage } from "react-icons/bs";
import { IoCloseCircle } from "react-icons/io5";
import useShowToast from "../hooks/useShowToast";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import usePreviewImg from "../hooks/usePreviewImg";

const MessageInput = ({ setMessages }) => {
  const [messageText, setMessageText] = useState("");
  const showToast = useShowToast();
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const setConversations = useSetRecoilState(conversationsAtom);
  const imageRef = useRef(null);
  const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !imgUrl) return;
    if (isSending) return;

    setIsSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          recipientId: selectedConversation.userId,
          img: imgUrl,
        }),
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      setMessages((messages) => [...messages, data]);
      setConversations((prevConvs) => {
        const updatedConversations = prevConvs.map((conversation) => {
          if (conversation._id === selectedConversation._id) {
            return {
              ...conversation,
              lastMessage: {
                text: messageText,
                sender: data.sender,
              },
            };
          }
          return conversation;
        });
        return updatedConversations;
      });
      setMessageText("");
      setImgUrl("");
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="pt-2">
      {/* Preview if attached */}
      {imgUrl && (
        <div className="relative mb-2 w-32 h-32 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
          <img src={imgUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => setImgUrl("")}
            className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-black"
          >
            <IoCloseCircle size={18} />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 p-1.5 pl-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 focus-within:ring-2 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-500 transition-all"
      >
        <button
          type="button"
          onClick={() => imageRef.current.click()}
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
          title="Attach image"
        >
          <BsImage size={18} />
        </button>
        <input type="file" hidden ref={imageRef} accept="image/*" onChange={handleImageChange} />

        <input
          type="text"
          placeholder="Message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none py-1"
        />

        <button
          type="submit"
          disabled={isSending || (!messageText.trim() && !imgUrl)}
          className={`p-2.5 rounded-full flex-shrink-0 transition-all duration-200 ${
            messageText.trim() || imgUrl
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 shadow-sm"
              : "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
          }`}
          title="Send"
        >
          {isSending ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
          ) : (
            <IoSend size={15} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
