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
  const [mobileViewport, setMobileViewport] = useState(null);
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
    const viewport = window.visualViewport;
    const syncMobileViewport = () => {
      if (window.innerWidth >= 768) {
        setMobileViewport(null);
        return;
      }
      const height = Math.round(viewport?.height || window.innerHeight);
      const top = Math.round(viewport?.offsetTop || 0);
      setMobileViewport((current) => current?.height === height && current?.top === top ? current : { height, top });
    };
    syncMobileViewport();
    viewport?.addEventListener("resize", syncMobileViewport);
    viewport?.addEventListener("scroll", syncMobileViewport);
    window.addEventListener("resize", syncMobileViewport);
    return () => {
      viewport?.removeEventListener("resize", syncMobileViewport);
      viewport?.removeEventListener("scroll", syncMobileViewport);
      window.removeEventListener("resize", syncMobileViewport);
    };
  }, []);

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
    const handleNewMessage = (message) => {
      const conversationId = String(message.conversationId || "");
      const senderId = String(message.sender || "");
      setConversations((previous) => {
        let found = false;
        const updated = previous.map((conversation) => {
          const matchesId = String(conversation?._id) === conversationId;
          const matchesMock = conversation?.mock && String(conversation?.participants?.[0]?._id) === senderId;
          if (!matchesId && !matchesMock) return conversation;
          found = true;
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
        });
        if (!found && message.senderProfile) {
          updated.push({
            _id: conversationId,
            updatedAt: message.createdAt || new Date().toISOString(),
            lastMessage: {
              text: message.text || (message.audio ? "Voice message" : message.img ? "Photo" : ""),
              sender: message.sender,
              type: message.audio ? "audio" : message.img ? "image" : "text",
              seen: false,
            },
            participants: [message.senderProfile],
          });
        }
        return updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      });
    };
    socket?.on("newMessage", handleNewMessage);
    return () => socket?.off("newMessage", handleNewMessage);
  }, [socket, setConversations]);

  useEffect(() => {
    const handleMessageDeleted = ({ conversationId, lastMessage, updatedAt }) => {
      setConversations((previous) => previous.map((conversation) =>
        String(conversation?._id) === String(conversationId)
          ? { ...conversation, lastMessage, updatedAt }
          : conversation
      ).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)));
    };
    socket?.on("messageDeleted", handleMessageDeleted);
    return () => socket?.off("messageDeleted", handleMessageDeleted);
  }, [socket, setConversations]);

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
          String(conversation?.participants?.[0]?._id) === String(searchedUser?._id)
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
    <div style={mobileViewport ? { top: `${mobileViewport.top}px`, height: `${mobileViewport.height}px`, maxHeight: `${mobileViewport.height}px` } : undefined} className={`fixed inset-0 z-30 flex h-[100dvh] max-h-[100dvh] min-h-0 w-full min-w-0 gap-0 overflow-hidden bg-white p-0 dark:bg-zinc-950 ${isConversationActive ? "" : "pt-[calc(env(safe-area-inset-top)_+_1.25rem)] pb-[calc(3.5rem_+_max(0.75rem,env(safe-area-inset-bottom)))]"} md:relative md:inset-auto md:z-auto md:mb-8 md:h-[calc(100dvh-150px)] md:max-h-[900px] md:min-h-[520px] md:gap-4 md:rounded-3xl md:border md:border-zinc-200/80 md:bg-white md:p-4 md:shadow-sm md:dark:border-zinc-800 md:dark:bg-zinc-950/60`}>
      {/* Conversation List */}
      <div
        className={`flex h-full min-w-0 w-full flex-col gap-3 overflow-hidden border-r border-zinc-100 px-4 dark:border-zinc-800/80 md:w-[320px] md:flex-shrink-0 md:px-0 md:pr-3 lg:w-[360px] ${
          isConversationActive ? "hidden md:flex" : "flex"
        }`}
      >
        <form onSubmit={handleConversationSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Find someone by username"
              aria-label="Find someone by username"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-4 text-sm text-zinc-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:bg-zinc-900 dark:focus:ring-indigo-950 placeholder:text-zinc-400"
            />
            <IoSearchOutline
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={16}
            />
          </div>
          <button
            type="submit"
            disabled={searchingUser || !searchText.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
        <div className="flex-1 space-y-1 overflow-y-auto overscroll-y-contain pr-1">
          {loadingConversations &&
            [0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-2xl p-3"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                <div className="flex flex-col w-full gap-2">
                  <div className="w-24 h-3 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="w-3/4 h-2.5 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            ))}

          {!loadingConversations && conversations.length === 0 && (
              <div className="flex h-52 flex-col items-center justify-center px-4 text-center text-zinc-400">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"><GiConversation size={24} /></span>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">No conversations yet</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Find someone above to start a chat.</p>
            </div>
          )}

          {!loadingConversations &&
            [...conversations]
              .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
              .map((conversation) => (
                <Conversation
                  key={conversation?._id}
                  isOnline={onlineUsers?.some((onlineId) => String(onlineId) === String(conversation?.participants?.[0]?._id))}
                  conversation={conversation}
                />
              ))}
        </div>
      </div>

      {/* Message Active Section */}
      <div
        className={`flex h-full min-w-0 flex-1 flex-col overflow-hidden ${
          !isConversationActive ? "hidden md:flex" : "flex"
        }`}
      >
        {!selectedConversation?._id ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-zinc-400 dark:text-zinc-500">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
              <GiConversation size={38} />
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
