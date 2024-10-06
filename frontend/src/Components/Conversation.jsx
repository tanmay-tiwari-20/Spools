import {
  Avatar,
  AvatarBadge,
  Image,
  Stack,
  Text,
  WrapItem,
} from "@chakra-ui/react";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All } from "react-icons/bs";
import { selectedConversationAtom } from "../atoms/messagesAtom";

const Conversation = ({ conversation }) => {
  const user = conversation.participants[0]; // Assuming participants always has at least one user
  const currentUser = useRecoilValue(userAtom);
  const lastMessage = conversation.lastMessage; // Ensure lastMessage is defined
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );

  const handleClick = () => {
    // Check if user and lastMessage are defined
    if (user?._id && lastMessage) {
      setSelectedConversation({
        _id: conversation._id || conversation.id, // Use _id if available
        userId: user._id,
        userProfilePic: user.profilePic,
        username: user.username,
      });
    }
  };

  return (
    <div
      className="flex gap-4 items-center p-1 hover:cursor-pointer hover:bg-gray-600 hover:dark:bg-gray-600 rounded-md"
      onClick={handleClick}
    >
      <WrapItem>
        <Avatar
          size={{
            base: "xs",
            sm: "sm",
            md: "md",
          }}
          src={user.profilePic}
        >
          <AvatarBadge boxSize="1em" bg="green.500" />
        </Avatar>
      </WrapItem>

      <Stack direction={"column"} fontSize={"sm"}>
        <Text fontWeight="700" display={"flex"} alignItems={"center"}>
          {user.username} <Image src="/verified.png" w={4} h={4} ml={1} />
        </Text>
        <Text fontSize={"xs"} display={"flex"} alignItems={"center"} gap={1}>
          {currentUser._id === lastMessage?.sender && <BsCheck2All size={18} />}
          {lastMessage?.text?.length > 18
            ? lastMessage.text.substring(0, 18) + "..."
            : lastMessage?.text}
        </Text>
      </Stack>
    </div>
  );
};

export default Conversation;
