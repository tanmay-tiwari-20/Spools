import { Avatar } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";

const Message = ({ ownMessage, message }) => {
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const user = useRecoilValue(userAtom);

  return (
    <div className={`flex gap-2 p-2 ${ownMessage ? "self-end" : "self-start"}`}>
      {!ownMessage && (
        <Avatar src={selectedConversation.userProfilePic} w={7} h={7} />
      )}
      <p
        className={`max-w-[330px] p-2 rounded-md ${
          ownMessage ? "bg-blue-400 text-white" : "bg-gray-400 text-black"
        }`}
      >
        {message.text}
      </p>
      {ownMessage && (
        <Avatar src={user.profilePic} w={7} h={7} />
      )}
    </div>
  );
};

export default Message;
