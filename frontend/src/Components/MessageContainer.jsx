import {
  Avatar,
  Divider,
  Image,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";

const MessageContainer = () => {
  const showToast = useShowToast();
  const [selectedConversation] = useRecoilState(selectedConversationAtom);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useRecoilValue(userAtom);

  useEffect(() => {
    const getMessages = async () => {
      if (!selectedConversation || !selectedConversation.userId) {
        return;
      }

      setLoading(true);
      try {
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
        setLoading(false);
      }
    };

    getMessages();
  }, [showToast, selectedConversation]);

  return (
    <div className="flex flex-[70%] bg-gray-600 rounded-md flex-col">
      <div className="flex w-full h-12 items-center gap-2 p-2">
        <Avatar
          src={selectedConversation.userProfilePic}
          size={"sm"}
        />
        <p className="flex items-center">
          {selectedConversation.username}
          <Image src="/verified.png" w={4} h={4} ml={1} />
        </p>
      </div>
      <Divider />

      <div className="flex flex-col gap-4 my-4 h-[400px] overflow-y-auto">
        {loading &&
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex gap-2 items-center p-1 rounded-md ${
                i % 2 === 0 ? "self-start" : "self-end"
              }`}
            >
              {i % 2 === 0 && <SkeletonCircle size={7} />}
              <div className="flex flex-col gap-2">
                <Skeleton h={"8px"} w={"250px"} />
                <Skeleton h={"8px"} w={"250px"} />
                <Skeleton h={"8px"} w={"250px"} />
              </div>
              {i % 2 !== 0 && <SkeletonCircle size={7} />}
            </div>
          ))}

        {!loading &&
          messages.map((message) => (
            <Message
              key={message._id} // Ensure unique key
              message={message}
              ownMessage={currentUser._id !== message.sender} // Determine if the message is from the current user
            />
          ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default MessageContainer;
