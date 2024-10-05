import { Button, Input, Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import Conversation from "../Components/Conversation";
import { GiConversation } from "react-icons/gi";
import MessageContainer from "../Components/MessageContainer";

const ChatPage = () => {
  return (
    <div className="absolute left-[50%] -translate-x-[50%] md:w-[750px] p-4 w-full">
      <div className="flex gap-4 flex-col md:flex-row max-w-[400px] md:max-w-full mx-auto">
        <div className="flex flex-[30%] gap-2 flex-col max-w-[250px] md:max-w-full mx-auto">
          <p className="font-bold text-gray-600 dark:text-gray-400">
            Your Conversations
          </p>
          <form>
            <div className="flex items-center gap-2">
              <Input placeholder="Search for a user..." />
              <Button size={"sm"}>
                <SearchIcon />
              </Button>
            </div>
          </form>
          {false &&
            [0, 1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex gap-4 items-center p-1 rounded-md">
                <div>
                  <SkeletonCircle size={10} />
                </div>
                <div className="flex w-full flex-col gap-3">
                  <Skeleton h={"10px"} w={"80px"} />
                  <Skeleton h={"8px"} w={"90%"} />
                </div>
              </div>
            ))}

          <Conversation />
          <Conversation />
          <Conversation />
        </div>

        {/* <div className="flex flex-[70%] rounded-md p-2 flex-col items-center justify-center h-[400px]">
          <GiConversation size={100} />
          <p className="">Select a conversation to start messaging</p>
        </div> */}
        <MessageContainer />
      </div>
    </div>
  );
};

export default ChatPage;
