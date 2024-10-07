import { useRef, useState } from "react";
import { IoSendSharp } from "react-icons/io5";
import { BsFillImageFill } from "react-icons/bs";
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
    if (!messageText && !imgUrl) return;
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
    <div className="flex items-center gap-2 bg-white dark:bg-ebony rounded-3xl">
      <form onSubmit={handleSendMessage} className="flex flex-grow">
        <input
          type="text"
          placeholder="Type a message..."
          onChange={(e) => setMessageText(e.target.value)}
          value={messageText}
          className="flex-grow px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-ebony text-gray-800 dark:text-white"
        />
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="p-2 bg-electricBlue hover:bg-electricBlue/90 dark:bg-softPurple rounded-full dark:hover:bg-softPurple/90 text-white ml-2"
          >
            <IoSendSharp size={20} className="-z-10" />
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center p-2 bg-electricBlue hover:bg-electricBlue/90 dark:bg-softPurple rounded-full dark:hover:bg-softPurple/90 text-white">
        <BsFillImageFill
          size={20}
          className="cursor-pointer"
          onClick={() => imageRef.current.click()}
        />
        <input type="file" hidden ref={imageRef} onChange={handleImageChange} />
      </div>
      {imgUrl && (
        <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-ebony bg-opacity-80 dark:bg-opacity-80 z-50 p-4 sm:p-8">
          <div className="relative w-full max-w-md">
            <img
              src={imgUrl}
              alt="Preview"
              className="rounded-lg shadow-lg w-full h-auto"
            />
            <button
              className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              onClick={() => setImgUrl("")}
            >
              &times;
            </button>
            <div className="flex justify-end mt-2">
              {!isSending ? (
                <button
                  className="flex items-center justify-center p-3 bg-electricBlue hover:bg-electricBlue/90 dark:bg-softPurple rounded-full dark:hover:bg-softPurple/90 text-white"
                  onClick={handleSendMessage}
                >
                  <IoSendSharp size={24} />
                </button>
              ) : (
                <div className="flex items-center">
                  <span className="loader"></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
