import { useEffect, useRef, useState } from "react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext.jsx";
import messageSound from "../assets/sounds/message.mp3";
import { Link } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const MessageContainer = () => {
  const showToast = useShowToast();
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messages, setMessages] = useState([]);
  const currentUser = useRecoilValue(userAtom);
  const { socket } = useSocket();
  const setConversations = useSetRecoilState(conversationsAtom);
  const messageEndRef = useRef(null);

  useEffect(() => {
    const handleNewMessage = (message) => {
      if (selectedConversation._id === String(message.conversationId)) {
        setMessages((prev) => [...prev, message]);
      }

      if (!document.hasFocus()) {
        try {
          const rawPrefs = localStorage.getItem("spools-preferences");
          const prefs = rawPrefs ? JSON.parse(rawPrefs) : {};
          const isMuted =
            prefs.soundEffects === false ||
            prefs.pauseNotifications === true ||
            prefs.notifyMessages === false;

          if (!isMuted) {
            const sound = new Audio(messageSound);
            sound.play();
          }
        } catch (e) {
          // audio autoplay may be restricted
        }
      }

      setConversations((prev) => {
        const updatedConversations = prev.map((conversation) => {
          if (conversation._id === String(message.conversationId)) {
            return {
              ...conversation,
              lastMessage: {
                text: message.text,
                sender: message.sender,
                seen: false,
              },
            };
          }
          return conversation;
        });
        return updatedConversations;
      });
    };
    socket?.on("newMessage", handleNewMessage);

    return () => socket?.off("newMessage", handleNewMessage);
  }, [socket, selectedConversation, setConversations]);

  useEffect(() => {
    const hasUnseenIncomingMessages = messages.some(
      (message) => String(message.sender) !== String(currentUser?._id) && !message.seen
    );
    if (!loadingMessages && hasUnseenIncomingMessages && selectedConversation._id) {
      socket?.emit("markMessagesAsSeen", {
        conversationId: selectedConversation._id,
      });
    }

    const handleMessagesSeen = ({ conversationId }) => {
      if (String(selectedConversation._id) === String(conversationId)) {
        setMessages((prev) => {
          return prev.map((message) => {
            if (String(message.sender) === String(currentUser?._id) && !message.seen) {
              return {
                ...message,
                seen: true,
              };
            }
            return message;
          });
        });
      }
    };
    socket?.on("messagesSeen", handleMessagesSeen);

    return () => socket?.off("messagesSeen", handleMessagesSeen);
  }, [socket, currentUser?._id, messages, loadingMessages, selectedConversation._id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const getMessages = async () => {
      setLoadingMessages(true);
      setMessages([]);
      try {
        if (selectedConversation.mock) return;
        const res = await fetch(`/api/messages/${selectedConversation.userId}`);
        const data = await res.json();
        if (data.error || !Array.isArray(data)) {
          if (data.error) showToast("Error", data.error, "error");
          setMessages([]);
          return;
        }
        setMessages(data);
      } catch (error) {
        showToast("Error", error.message, "error");
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    getMessages();
  }, [showToast, selectedConversation.userId, selectedConversation.mock]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <button
          onClick={() => setSelectedConversation({})}
          className="md:hidden p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          title="Back to conversations"
        >
          <IoArrowBack size={20} />
        </button>

        <Link
          to={`/${selectedConversation.username}`}
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          <img
            src={selectedConversation.userProfilePic || "/defaultdp.png"}
            alt={selectedConversation.username}
            className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {selectedConversation.username}
              </span>
              <img src="/verified.png" alt="Verified" className="w-3.5 h-3.5 inline" />
            </div>
            <span className="text-xs text-zinc-400">View profile</span>
          </div>
        </Link>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto py-4 px-1 sm:px-2 space-y-1">
        {loadingMessages &&
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`flex gap-2 items-center p-1 ${
                i % 2 === 0 ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse ${
                  i % 2 === 0 ? "w-48" : "w-60"
                }`}
              />
            </div>
          ))}

        {!loadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 py-12">
            <span className="text-3xl mb-2">👋</span>
            <p className="text-sm font-medium">Say hello to {selectedConversation.username}!</p>
            <p className="text-xs text-zinc-500 mt-1">Send a message to start this spool chat.</p>
          </div>
        )}

        {!loadingMessages &&
          messages.map((message) => (
            <div
              key={message._id || Math.random()}
              ref={
                messages.length - 1 === messages.indexOf(message)
                  ? messageEndRef
                  : null
              }
            >
              <Message
                message={message}
                ownMessage={currentUser._id === message.sender}
              />
            </div>
          ))}
      </div>

      {/* Message Input Bar */}
      <MessageInput setMessages={setMessages} />
    </div>
  );
};

export default MessageContainer;
