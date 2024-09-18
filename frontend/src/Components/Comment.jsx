import { Avatar, Divider } from "@chakra-ui/react";
import { useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import Actions from "./Actions";

const Comment = () => {
  const [liked, setLiked] = useState(false);
  return (
    <>
      <div className="flex gap-4 py-2 my-2 w-full">
        <Avatar src="/zuck-avatar.png" size={"sm"} />
        <div className="flex gap-1 w-full flex-col">
          <div className="flex w-full items-center justify-between">
            <p className="text-sm font-bold">markzuckerberg</p>
            <div className="flex gap-2 items-center">
              <p className="text-sm text-[#8e8e8e]">1d</p>
              <BsThreeDots />
            </div>
          </div>
          <p>Hey this looks great!</p>
          <Actions liked={liked} setLiked={setLiked} />
          <p className="text-sm text-[#8e8e8e]"></p>
        </div>
      </div>
      <Divider />
    </>
  );
};

export default Comment;
