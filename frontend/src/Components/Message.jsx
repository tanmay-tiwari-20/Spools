import { Avatar } from "@chakra-ui/react";

const Message = ({ ownMessage }) => {
  return (
    <>
      {ownMessage ? (
        <div className="flex self-end gap-2 p-2">
          <p className="max-w-[330px] bg-blue-400 p-1 rounded-md">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </p>
          <Avatar src="" w={7} h={7} />
        </div>
      ) : (
        <div className="flex gap-2 p-2">
          <Avatar src="" w={7} h={7} />
          <p className="max-w-[330px] bg-gray-400 p-1 rounded-md">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </p>
        </div>
      )}
    </>
  );
};

export default Message;
