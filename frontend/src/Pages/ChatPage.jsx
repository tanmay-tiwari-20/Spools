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
    socket?.on("messagesSeen", ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation?._id === conversationId
            ? {
                ...conversation,
                lastMessage: { ...conversation.lastMessage, seen: true },
              }
            : conversation
        )
      );
    });
  }, [socket, setConversations]);

  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await fetch("/api/messages/conversations");
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        const sortedConversations = data.sort((a, b) => {
          const lastMessageA = new Date(a.updatedAt);
          const lastMessageB = new Date(b.updatedAt);
          return lastMessageB - lastMessageA;
        });
        setConversations(sortedConversations);
      } catch (error) {
        showToast("Error", error.message, "error");
      } finally {
        setLoadingConversations(false);
      }
    };

    getConversations();
  }, [showToast, setConversations]);

  const handleConversationSearch = async (e) => {
    e.preventDefault();
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
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setSearchingUser(false);
    }
  };

  return (
    <div className="absolute left-1/2 w-full max-w-7xl bg-white dark:bg-ebony p-4 transform -translate-x-1/2">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Conversation List */}
        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <form onSubmit={handleConversationSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search for a user..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-3 py-2 border rounded-full focus:outline-none focus:ring-2 dark:bg-ebony dark:text-gray-300 dark:border-gray-600"
            />
            <button
              type="submit"
              disabled={searchingUser}
              className={`flex items-center justify-center px-3 py-2 rounded-full text-white ${
                searchingUser
                  ? "bg-blue-300"
                  : "bg-electricBlue hover:bg-electricBlue/90 dark:bg-softPurple dark:hover:bg-softPurple/90 text-white"
              }`}
            >
              <IoSearchOutline />
            </button>
          </form>
          {/* Loading skeletons */}
          {loadingConversations &&
            [0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex gap-4 items-center p-2 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                <div className="flex flex-col w-full gap-2">
                  <div className="w-20 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                  <div className="w-3/4 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                </div>
              </div>
            ))}
          {/* Conversations */}
          {!loadingConversations && conversations.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
              <p>No conversations found.</p>
            </div>
          ) : (
            !loadingConversations &&
            conversations.map((conversation) => (
              <Conversation
                key={conversation?._id}
                isOnline={onlineUsers?.includes(
                  conversation?.participants?.[0]?._id
                )}
                conversation={conversation}
              />
            ))
          )}
        </div>

        {/* Message Section */}
        <div className="flex-1 rounded-3xl p-3 bg-white dark:bg-ebony border">
          {!selectedConversation?._id ? (
            <div className="flex flex-col items-center justify-center h-96">
              <GiConversation
                className="text-gray-500 dark:text-gray-400"
                size={100}
              />
              <p className="text-center text-xl text-gray-600 dark:text-gray-300 mt-4">
                Select a conversation to start messaging...
              </p>
            </div>
          ) : (
            <MessageContainer />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
