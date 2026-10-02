import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { BsImage } from "react-icons/bs";
import { IoCloseCircle } from "react-icons/io5";
import { FiCornerUpLeft, FiX } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import usePreviewImg from "../hooks/usePreviewImg";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext.jsx";

const MessageInput = ({ setMessages, replyingTo, onCancelReply }) => {
  const [messageText, setMessageText] = useState("");
  const showToast = useShowToast();
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const setConversations = useSetRecoilState(conversationsAtom);
  const currentUser = useRecoilValue(userAtom);
  const { socket } = useSocket();
  const imageRef = useRef(null);
  const textAreaRef = useRef(null);
  const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef(null);
  const typingConversationIdRef = useRef("");

  const stopTyping = () => {
    clearTimeout(typingTimeoutRef.current);
    if (typingConversationIdRef.current) {
      socket?.emit("stopTyping", {
        conversationId: typingConversationIdRef.current,
        recipientId: selectedConversation.userId,
      });
      typingConversationIdRef.current = "";
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (typingConversationIdRef.current) {
        socket?.emit("stopTyping", {
          conversationId: typingConversationIdRef.current,
          recipientId: selectedConversation.userId,
        });
        typingConversationIdRef.current = "";
      }
    };
  }, [socket, selectedConversation.userId]);

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
          replyTo: replyingTo?._id || null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      setMessages((messages) => [...messages, data]);
      const conversationId = String(data.conversationId || selectedConversation._id);
      const nextConversation = {
        _id: conversationId,
        updatedAt: data.createdAt || new Date().toISOString(),
        lastMessage: { text: messageText.trim(), sender: data.sender, seen: false },
        participants: [{
          _id: selectedConversation.userId,
          username: selectedConversation.username,
          profilePic: selectedConversation.userProfilePic,
        }],
        mock: false,
      };
      setConversations((prevConvs) => {
        const withoutDuplicate = prevConvs.filter((conversation) =>
          String(conversation._id) !== String(selectedConversation._id) &&
          String(conversation._id) !== conversationId &&
          String(conversation?.participants?.[0]?._id) !== String(selectedConversation.userId)
        );
        return [nextConversation, ...withoutDuplicate];
      });
      setSelectedConversation((current) => ({ ...current, _id: conversationId, mock: false }));
      stopTyping();
      setMessageText("");
      onCancelReply?.();
      if (textAreaRef.current) {
        textAreaRef.current.style.height = "36px";
        textAreaRef.current.style.overflowY = "hidden";
      }
      setImgUrl("");
      if (imageRef.current) imageRef.current.value = "";
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleTextChange = (event) => {
    const nextText = event.target.value;
    setMessageText(nextText);
    const conversationId = String(selectedConversation?._id || "");
    if (conversationId && !selectedConversation?.mock && nextText.trim()) {
      if (typingConversationIdRef.current !== conversationId) {
        stopTyping();
        typingConversationIdRef.current = conversationId;
        socket?.emit("typing", { conversationId, recipientId: selectedConversation.userId });
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(stopTyping, 1600);
    } else {
      stopTyping();
    }
    event.target.style.height = "auto";
    const contentHeight = event.target.scrollHeight;
    event.target.style.height = `${Math.min(contentHeight, 112)}px`;
    event.target.style.overflowY = contentHeight > 112 ? "auto" : "hidden";
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="border-t border-zinc-100 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
      {replyingTo && (
        <div className="mb-2 flex items-center gap-2.5 overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50 to-white px-3 py-2 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/55 dark:to-zinc-900">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/70 dark:text-indigo-300"><FiCornerUpLeft size={16} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              Replying to {String(replyingTo.sender) === String(currentUser?._id) ? "your message" : `@${selectedConversation.username}`}
            </p>
            <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">{replyingTo.text || (replyingTo.img ? "Photo" : "Message")}</p>
          </div>
          {replyingTo.img && <img src={replyingTo.img} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />}
          <button type="button" onClick={onCancelReply} aria-label="Cancel reply" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-indigo-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"><FiX size={15} /></button>
        </div>
      )}

      {/* Preview if attached */}
      {imgUrl && (
        <div className="relative mb-2 w-32 h-32 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
          <img src={imgUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setImgUrl("");
              if (imageRef.current) imageRef.current.value = "";
            }}
            aria-label="Remove attached image"
            className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-black"
          >
            <IoCloseCircle size={18} />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="mx-1 flex items-center gap-2 p-1.5 pl-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 focus-within:ring-2 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-500 transition-all"
      >
        <button
          type="button"
          onClick={() => imageRef.current?.click()}
          aria-label="Attach an image"
          className="w-10 h-10 grid place-items-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
          title="Attach image"
        >
          <BsImage size={18} />
        </button>
        <input type="file" hidden ref={imageRef} accept="image/*" disabled={isSending} onChange={handleImageChange} />

        <textarea
          ref={textAreaRef}
          rows={1}
          disabled={isSending}
          placeholder="Write a message..."
          value={messageText}
          onChange={handleTextChange}
          onKeyDown={handleComposerKeyDown}
          aria-label="Write a message"
          className="flex-1 min-w-0 max-h-28 resize-none overflow-y-hidden bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none py-2 leading-5"
        />

        <button
          type="submit"
          disabled={isSending || (!messageText.trim() && !imgUrl)}
          aria-label="Send message"
          className={`w-10 h-10 grid place-items-center rounded-full flex-shrink-0 transition-all duration-200 ${
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
