import { useEffect, useRef, useState } from "react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import useShowToast from "../hooks/useShowToast";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext.jsx";
import messageSound from "../assets/sounds/message.mp3";

const MessageContainer = () => {
  const showToast = useShowToast();
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messages, setMessages] = useState([]);
  const currentUser = useRecoilValue(userAtom);
  const { socket } = useSocket();
  const setConversations = useSetRecoilState(conversationsAtom);
  const messageEndRef = useRef(null);

  useEffect(() => {
    socket.on("newMessage", (message) => {
      if (selectedConversation._id === message.conversationId) {
        setMessages((prev) => [...prev, message]);
      }

      // make a sound if the window is not focused
      if (!document.hasFocus()) {
        const sound = new Audio(messageSound);
        sound.play();
      }

      setConversations((prev) => {
        const updatedConversations = prev.map((conversation) => {
          if (conversation._id === message.conversationId) {
            return {
              ...conversation,
              lastMessage: {
                text: message.text,
                sender: message.sender,
              },
            };
          }
          return conversation;
        });
        return updatedConversations;
      });
    });

    return () => socket.off("newMessage");
  }, [socket, selectedConversation, setConversations]);

  useEffect(() => {
    const lastMessageIsFromOtherUser =
      messages.length &&
      messages[messages.length - 1].sender !== currentUser._id;
    if (lastMessageIsFromOtherUser) {
      socket.emit("markMessagesAsSeen", {
        conversationId: selectedConversation._id,
        userId: selectedConversation.userId,
      });
    }

    socket.on("messagesSeen", ({ conversationId }) => {
      if (selectedConversation._id === conversationId) {
        setMessages((prev) => {
          const updatedMessages = prev.map((message) => {
            if (!message.seen) {
              return {
                ...message,
                seen: true,
              };
            }
            return message;
          });
          return updatedMessages;
        });
      }
    });
  }, [socket, currentUser._id, messages, selectedConversation]);

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
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setMessages(data);
      } catch (error) {
        showToast("Error", error.message, "error");
      } finally {
        setLoadingMessages(false);
      }
    };

    getMessages();
  }, [showToast, selectedConversation.userId, selectedConversation.mock]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-ebony rounded-md p-1">
      {/* Message header */}
      <div className="flex items-center gap-2 mb-2">
        <img
          src={selectedConversation.userProfilePic || "defaultdp.png"}
          alt={selectedConversation.username}
          className="md:w-12 md:h-12 w-8 h-8 rounded-full object-cover"
        />
        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
          {selectedConversation.username}
          <img
            src="/verified.png"
            alt="Verified"
            className="w-4 h-4 ml-1 inline"
          />
        </p>
      </div>

      <hr className="border-gray-300 dark:border-gray-700" />

      {/* Messages */}
      <div className="flex flex-col gap-4 my-4 p-2 h-96 overflow-y-auto">
        {loadingMessages &&
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex gap-2 items-center p-1 rounded-md ${
                i % 2 === 0 ? "self-start" : "self-end"
              }`}
            >
              {i % 2 === 0 && (
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
              )}
              <div className="flex flex-col gap-2">
                <div className="w-60 h-2 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                <div className="w-60 h-2 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                <div className="w-60 h-2 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              </div>
              {i % 2 !== 0 && (
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
              )}
            </div>
          ))}

        {!loadingMessages &&
          messages.map((message) => (
            <div
              key={message._id}
              ref={
                messages.length - 1 === messages.indexOf(message)
                  ? messageEndRef
                  : null
              }
              className={`flex ${
                currentUser._id === message.sender ? "self-end" : "self-start"
              }`}
            >
              <Message
                message={message}
                ownMessage={currentUser._id === message.sender}
              />
            </div>
          ))}
      </div>

      {/* Message Input */}
      <MessageInput setMessages={setMessages} />
    </div>
  );
};

export default MessageContainer;
