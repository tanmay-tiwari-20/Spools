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
  const { socket, onlineUsers } = useSocket();
  const setConversations = useSetRecoilState(conversationsAtom);
  const messageEndRef = useRef(null);
  const selectedConversationId = String(selectedConversation?._id || "");

  useEffect(() => {
    const handleNewMessage = (message) => {
      const conversationId = String(message.conversationId || "");
      const isSelectedNewConversation = Boolean(
        selectedConversation?.mock &&
          String(message.sender) === String(selectedConversation.userId)
      );
      if (selectedConversationId === conversationId || isSelectedNewConversation) {
        if (isSelectedNewConversation) {
          setSelectedConversation((current) => ({
            ...current,
            _id: conversationId,
            mock: false,
          }));
        }
        setMessages((prev) => prev.some((item) => String(item._id) === String(message._id))
          ? prev
          : [...prev, message]);
      }

      setConversations((prev) => {
        const updatedConversations = prev.map((conversation) => {
          if (
            String(conversation._id) === conversationId ||
            (conversation?.mock && String(conversation?.participants?.[0]?._id) === String(message.sender))
          ) {
            return {
              ...conversation,
              _id: conversationId,
              mock: false,
              updatedAt: message.createdAt || new Date().toISOString(),
              lastMessage: {
                text: message.text,
                sender: message.sender,
                seen: false,
              },
            };
          }
          return conversation;
        });
        return updatedConversations.sort((a, b) =>
          new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
      });
    };
    socket?.on("newMessage", handleNewMessage);

    return () => socket?.off("newMessage", handleNewMessage);
  }, [socket, selectedConversationId, selectedConversation, setConversations, setSelectedConversation]);

  useEffect(() => {
    const hasUnseenIncomingMessages = messages.some(
      (message) => String(message.sender) !== String(currentUser?._id) && !message.seen
    );
    if (!loadingMessages && hasUnseenIncomingMessages && selectedConversationId) {
      socket?.emit("markMessagesAsSeen", {
        conversationId: selectedConversationId,
      });
      setConversations((prev) => prev.map((conversation) =>
        String(conversation._id) === selectedConversationId &&
        String(conversation?.lastMessage?.sender) !== String(currentUser?._id)
          ? { ...conversation, lastMessage: { ...conversation.lastMessage, seen: true } }
          : conversation
      ));
    }

    const handleMessagesSeen = ({ conversationId }) => {
      if (selectedConversationId === String(conversationId)) {
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
  }, [socket, currentUser?._id, messages, loadingMessages, selectedConversationId, setConversations]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const abortController = new AbortController();
    const getMessages = async () => {
      setLoadingMessages(true);
      setMessages([]);
      try {
        if (selectedConversation.mock) return;
        const res = await fetch(`/api/messages/${selectedConversation.userId}`, {
          signal: abortController.signal,
        });
        const data = await res.json();
        if (abortController.signal.aborted) return;
        if (data.error || !Array.isArray(data)) {
          if (data.error) showToast("Error", data.error, "error");
          setMessages([]);
          return;
        }
        setMessages((current) => {
          const fetchedIds = new Set(data.map((message) => String(message._id)));
          return [
            ...data,
            ...current.filter((message) => !fetchedIds.has(String(message._id))),
          ];
        });
      } catch (error) {
        if (error.name === "AbortError") return;
        showToast("Error", error.message, "error");
        setMessages([]);
      } finally {
        if (!abortController.signal.aborted) setLoadingMessages(false);
      }
    };

    getMessages();
    return () => abortController.abort();
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
            <span className="text-xs text-zinc-400">
              {onlineUsers?.includes(selectedConversation.userId) ? "Active now" : "View profile"}
            </span>
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
          messages.map((message, index) => (
            <div
              key={message._id || `${message.createdAt}-${message.sender}`}
              ref={index === messages.length - 1 ? messageEndRef : null}
            >
              <Message
                message={message}
                ownMessage={String(currentUser?._id) === String(message.sender)}
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
