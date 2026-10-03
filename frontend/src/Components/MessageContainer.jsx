import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [replyingTo, setReplyingTo] = useState(null);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const currentUser = useRecoilValue(userAtom);
  const { socket, onlineUsers } = useSocket();
  const setConversations = useSetRecoilState(conversationsAtom);
  const messageScrollRef = useRef(null);
  const shouldStickToBottom = useRef(true);
  const previousConversationId = useRef(String(selectedConversation?._id || ""));
  const selectedConversationId = String(selectedConversation?._id || "");
  const isPeerOnline = Boolean(onlineUsers?.some((id) => String(id) === String(selectedConversation?.userId)));

  useEffect(() => {
    setRemoteTyping(false);
    if (!socket || !selectedConversationId || selectedConversation?.mock) return undefined;
    let typingTimeout;
    const handleTyping = ({ conversationId, userId }) => {
      if (String(conversationId) !== selectedConversationId || String(userId) !== String(selectedConversation.userId)) return;
      setRemoteTyping(true);
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => setRemoteTyping(false), 2400);
    };
    const handleStoppedTyping = ({ conversationId, userId }) => {
      if (String(conversationId) === selectedConversationId && String(userId) === String(selectedConversation.userId)) {
        clearTimeout(typingTimeout);
        setRemoteTyping(false);
      }
    };
    socket.on("userTyping", handleTyping);
    socket.on("userStoppedTyping", handleStoppedTyping);
    return () => {
      clearTimeout(typingTimeout);
      socket.off("userTyping", handleTyping);
      socket.off("userStoppedTyping", handleStoppedTyping);
    };
  }, [socket, selectedConversationId, selectedConversation?.userId, selectedConversation?.mock]);

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
                text: message.text || (message.audio ? "Voice message" : message.img ? "Photo" : ""),
                sender: message.sender,
                type: message.audio ? "audio" : message.img ? "image" : "text",
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
    const handleDeletedMessage = ({ conversationId, messageId }) => {
      if (String(conversationId) === selectedConversationId) {
        setMessages((previous) => previous.filter((message) => String(message._id) !== String(messageId)));
      }
    };
    socket?.on("messageDeleted", handleDeletedMessage);
    return () => socket?.off("messageDeleted", handleDeletedMessage);
  }, [socket, selectedConversationId]);

  useEffect(() => {
    const hasUnseenIncomingMessages = messages.some(
      (message) => String(message.sender) !== String(currentUser?._id) && !message.seen
    );
    if (!loadingMessages && hasUnseenIncomingMessages && selectedConversationId) {
      socket?.emit("markMessagesAsSeen", {
        conversationId: selectedConversationId,
      });
      setConversations((prev) => prev.map((conversation) =>
        String(conversation._id) === selectedConversationId
          ? {
              ...conversation,
              unreadCount: 0,
              lastMessage: String(conversation?.lastMessage?.sender) !== String(currentUser?._id)
                ? { ...conversation.lastMessage, seen: true }
                : conversation.lastMessage,
            }
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

  useLayoutEffect(() => {
    const viewport = messageScrollRef.current;
    if (!viewport) return;

    const conversationChanged = previousConversationId.current !== selectedConversationId;
    if (conversationChanged) {
      previousConversationId.current = selectedConversationId;
      shouldStickToBottom.current = true;
      setReplyingTo(null);
    }
    if (loadingMessages) return;

    if (conversationChanged || shouldStickToBottom.current) {
      viewport.scrollTop = viewport.scrollHeight;
      shouldStickToBottom.current = true;
    }
  }, [messages, loadingMessages, selectedConversationId, remoteTyping]);

  const scrollToLatestIfNeeded = () => {
    const viewport = messageScrollRef.current;
    if (viewport && shouldStickToBottom.current) viewport.scrollTop = viewport.scrollHeight;
  };

  const handleScroll = (event) => {
    const viewport = event.currentTarget;
    shouldStickToBottom.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 80;
  };

  const handleDeleteMessage = (message, result) => {
    setMessages((previous) => previous.filter((item) => String(item._id) !== String(message._id)));
    setConversations((previous) => previous.map((conversation) =>
      String(conversation._id) === String(result.conversationId)
        ? { ...conversation, lastMessage: result.lastMessage, updatedAt: result.updatedAt }
        : conversation
    ));
  };

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
    <div className="flex h-full flex-col overflow-hidden pt-[env(safe-area-inset-top)] md:pt-0">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-100 px-3 pb-3 pt-2 dark:border-zinc-800/80 md:px-0 md:pt-0">
        <button
          onClick={() => setSelectedConversation({})}
          className="grid h-9 w-9 place-items-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
          title="Back to conversations"
        >
          <IoArrowBack size={20} />
        </button>

        <Link
          to={`/${selectedConversation.username}`}
          className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-85"
        >
          <span className="relative block h-10 w-10 shrink-0">
            <img
              src={selectedConversation.userProfilePic || "/defaultdp.png"}
              alt={selectedConversation.username}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
            />
            {isPeerOnline && <span aria-label="Online" title="Online" className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950" />}
          </span>
          <div>
            <div className="flex items-center gap-1">
              <span className="max-w-[65vw] truncate text-sm font-bold text-zinc-900 dark:text-zinc-100 sm:max-w-none">
                @{selectedConversation.username}
              </span>
              <img src="/verified.png" alt="Verified" className="w-3.5 h-3.5 inline" />
            </div>
            <span className={`text-xs ${remoteTyping ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}>
              {remoteTyping ? "typing…" : isPeerOnline ? "Active now" : "View profile"}
            </span>
          </div>
        </Link>
      </div>

      {/* Messages Scroll Area */}
      <div ref={messageScrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-4 sm:px-4 md:px-2">
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
          <div className="flex h-full flex-col items-center justify-center py-12 text-center text-zinc-400">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">👋</span>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Say hello to @{selectedConversation.username}!</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Send a message to start your conversation.</p>
          </div>
        )}

        {!loadingMessages &&
          messages.map((message) => (
            <div key={message._id || `${message.createdAt}-${message.sender}`}>
              <Message
                message={message}
                ownMessage={String(currentUser?._id) === String(message.sender)}
                onReply={setReplyingTo}
                onDelete={handleDeleteMessage}
                onImageLoad={scrollToLatestIfNeeded}
              />
            </div>
          ))}

        {!loadingMessages && remoteTyping && (
          <div className="mb-3 flex items-end gap-2" aria-label={`${selectedConversation.username} is typing`}>
            <img src={selectedConversation.userProfilePic || "/defaultdp.png"} alt="" className="mb-1 h-7 w-7 rounded-full object-cover" />
            <div className="flex h-9 items-center gap-1 rounded-2xl rounded-bl-sm bg-zinc-100 px-3 dark:bg-zinc-800">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.25s] dark:bg-zinc-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.12s] dark:bg-zinc-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 dark:bg-zinc-400" />
            </div>
          </div>
        )}
      </div>

      {/* Message Input Bar */}
      <div className="px-2 md:px-0">
        <MessageInput setMessages={setMessages} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} />
      </div>
    </div>
  );
};

export default MessageContainer;
