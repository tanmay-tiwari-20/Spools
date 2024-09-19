import { Avatar, Box, Divider, Image } from "@chakra-ui/react";
import { BsThreeDots } from "react-icons/bs";
import Actions from "../Components/Actions";
import Comment from "../Components/Comment";

const PostPage = () => {
  return (
    <>
      <div className="flex">
        <div className="flex items-center w-full gap-3">
          <Avatar src="/zuck-avatar.png" size={"md"} name="Mark Zuckerberg" />
          <div className="flex">
            <p className="text-sm font-bold">markzuckerberg</p>
            <Image src="/verified.png" w="4" h="4" ml={4} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-[#8e8e8e]">1d</p>
          <BsThreeDots />
        </div>
      </div>

      <p className="my-3">Let&apos;s talk about Spools.</p>

      <Box
        borderRadius={6}
        overflow={"hidden"}
        border={"1px solid"}
        borderColor={"#8e8e8e"}
      >
        <Image src={"/post1.png"} w={"full"} />
      </Box>

      <div className="flex gap-3 my-3">
        <Actions />
      </div>

      <div className="flex items-center gap-2">
        <p className="text-[#8e8e8e] text-sm">238 repiles</p>
        <Box w={0.5} h={0.5} borderRadius={"full"} bg={"#8e8e8e"}></Box>
        <p className="text-[#8e8e8e] text-sm">123 likes</p>
      </div>
      <Divider my={4} />

      <div className="flex justify-between">
        <div className="flex gap-2 items-center">
          <p className="text-2xl">👋</p>
          <p className="text-[#8e8e8e]">Get the app to like, post and reply.</p>
        </div>
        <button className="px-3 text-white py-1 bg-[#8e8e8e] rounded-full">
          Get
        </button>
      </div>

      <Divider my={4} />
      <Comment />
      <Comment />
      <Comment />
    </>
  );
};

export default PostPage;
