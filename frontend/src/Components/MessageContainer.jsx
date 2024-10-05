import {
  Avatar,
  Divider,
  Image,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";
import Message from "./Message";
import MessageInput from "./MessageInput";

const MessageContainer = () => {
  return (
    <div className="flex flex-[70%] bg-gray-600 rounded-md flex-col">
      <div className="flex w-full h-12 items-center gap-2 p-2">
        <Avatar src="" size={"sm"} />
        <p className="flex items-center">
          User Name
          <Image src="/verified.png" w={4} h={4} ml={1} />
        </p>
      </div>
      <Divider />

      <div className="flex flex-col gap-4 my-4 h-[400px] overflow-y-auto">
        {false &&
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

          <Message ownMessage={true} />
          <Message ownMessage={false} />
          <Message ownMessage={false} />
          <Message ownMessage={true} />
          <Message ownMessage={false} />
          <Message ownMessage={true} />
          <Message ownMessage={false} />
          <Message ownMessage={true} />
      </div>

      <MessageInput />
    </div>
  );
};

export default MessageContainer;
