import { GiConversation } from "react-icons/gi";
import { useEffect, useState } from "react";
import Conversation from "../Components/Conversation";
import MessageContainer from "../Components/MessageContainer";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext";
import { IoSearchOutline } from "react-icons/io5";

const ChatPage = () => {
  const [searchingUser, setSearchingUser] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );
  const [conversations, setConversations] = useRecoilState(conversationsAtom);
  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const { socket, onlineUsers } = useSocket();

  useEffect(() => {
    const handleMessagesSeen = ({ conversationId, readerId }) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          String(conversation?._id) === String(conversationId) &&
          String(conversation?.lastMessage?.sender) === String(currentUser?._id) &&
          String(readerId) !== String(currentUser?._id)
            ? {
                ...conversation,
                lastMessage: { ...conversation.lastMessage, seen: true },
              }
            : conversation
        )
      );
    };
    socket?.on("messagesSeen", handleMessagesSeen);
    return () => socket?.off("messagesSeen", handleMessagesSeen);
  }, [socket, setConversations, currentUser?._id]);

  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await fetch("/api/messages/conversations");
        const data = await res.json();
        if (data.error || data.message || !Array.isArray(data)) {
          if (data.error) showToast("Error", data.error, "error");
          setConversations([]);
          return;
        }
        const sortedConversations = [...data].sort((a, b) => {
          const lastMessageA = new Date(a.updatedAt);
          const lastMessageB = new Date(b.updatedAt);
          return lastMessageB - lastMessageA;
        });
        setConversations(sortedConversations);
      } catch (error) {
        showToast("Error", error.message, "error");
        setConversations([]);
      } finally {
        setLoadingConversations(false);
      }
    };

    getConversations();
  }, [showToast, setConversations]);

  const handleConversationSearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    setSearchingUser(true);
    try {
      const res = await fetch(`/api/users/profile/${searchText}`);
      const searchedUser = await res.json();
      if (searchedUser.error) {
        showToast("Error", searchedUser.error, "error");
        return;
      }

      const messagingYourself = searchedUser?._id === currentUser?._id;
      if (messagingYourself) {
        showToast("Error", "You cannot message yourself", "error");
        return;
      }

      const conversationAlreadyExists = conversations.find(
        (conversation) =>
          conversation?.participants?.[0]?._id === searchedUser?._id
      );

      if (conversationAlreadyExists) {
        setSelectedConversation({
          _id: conversationAlreadyExists?._id,
          userId: searchedUser?._id,
          username: searchedUser?.username,
          userProfilePic: searchedUser?.profilePic,
        });
        setSearchText("");
        return;
      }

      const mockConversation = {
        mock: true,
        lastMessage: { text: "", sender: "" },
        _id: Date.now().toString(),
        participants: [
          {
            _id: searchedUser?._id,
            username: searchedUser?.username,
            profilePic: searchedUser?.profilePic,
          },
        ],
      };
      setConversations((prevConvs) => [...prevConvs, mockConversation]);
      setSelectedConversation({
        _id: mockConversation._id,
        userId: searchedUser?._id,
        username: searchedUser?.username,
        userProfilePic: searchedUser?.profilePic,
        mock: true,
      });
      setSearchText("");
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setSearchingUser(false);
    }
  };

  const isConversationActive = Boolean(selectedConversation?._id);

  return (
    <div className="w-full min-w-0 bg-white dark:bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-2.5 sm:p-4 shadow-sm h-[calc(100dvh-176px)] min-h-[360px] max-h-[900px] flex gap-2 sm:gap-4 overflow-hidden mb-8">
      {/* Conversation List */}
      <div
        className={`flex flex-col gap-3 min-w-0 w-full md:w-1/3 border-r border-zinc-100 dark:border-zinc-800/80 pr-0 md:pr-3 h-full overflow-hidden ${
          isConversationActive ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Messages
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {conversations.length}
          </span>
        </div>

        <form onSubmit={handleConversationSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search user to chat..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:text-zinc-100 placeholder-zinc-400"
            />
            <IoSearchOutline
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={16}
            />
          </div>
          <button
            type="submit"
            disabled={searchingUser || !searchText.trim()}
            className="p-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
            title="Search"
          >
            {searchingUser ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
            ) : (
              <IoSearchOutline size={16} />
            )}
          </button>
        </form>

        {/* Conversation List Body */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {loadingConversations &&
            [0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex gap-3 items-center p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                <div className="flex flex-col w-full gap-2">
                  <div className="w-24 h-3 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="w-3/4 h-2.5 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            ))}

          {!loadingConversations && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-400 text-center px-4">
              <span className="text-3xl mb-2">💬</span>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1">Search for a user above to message them.</p>
            </div>
          )}

          {!loadingConversations &&
            conversations.map((conversation) => (
              <Conversation
                key={conversation?._id}
                isOnline={onlineUsers?.includes(
                  conversation?.participants?.[0]?._id
                )}
                conversation={conversation}
              />
            ))}
        </div>
      </div>

      {/* Message Active Section */}
      <div
        className={`flex-1 min-w-0 h-full overflow-hidden flex flex-col ${
          !isConversationActive ? "hidden md:flex" : "flex"
        }`}
      >
        {!selectedConversation?._id ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500">
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mb-4">
              <GiConversation size={42} className="opacity-70" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              Your messages
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs text-center">
              Send direct messages to other users. Choose a conversation on the left to get started.
            </p>
          </div>
        ) : (
          <MessageContainer />
        )}
      </div>
    </div>
  );
};

export default ChatPage;
