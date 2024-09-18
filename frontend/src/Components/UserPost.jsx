import { Avatar, Box, Image, Text } from "@chakra-ui/react";
import { BsThreeDots } from "react-icons/bs";
import { Link } from "react-router-dom";
import Actions from "./Actions";

const UserPost = ({ likes, replies, postImg, postTitle }) => {
  return (
    <Link to={"/markzuckeberg/post/1"}>
      <div className="flex gap-3 mb-3 py-5">
        <div className="flex flex-col items-center">
          <Avatar size="md" name="Mark Zuckerberg" src="/zuck-avatar.png" />
          <Box className="w-[1px] h-full bg-lightGray my-2"></Box>
          <Box className="relative w-full">
            <Avatar
              size="xs"
              name="John Doe"
              src="https://bit.ly/dan-abramov"
              position={"absolute"}
              top={"0px"}
              left="15px"
              padding={"2px"}
            />
            <Avatar
              size="xs"
              name="John Doe"
              src="https://bit.ly/sage-adebayo"
              position={"absolute"}
              bottom={"0px"}
              right="-5px"
              padding={"2px"}
            />
            <Avatar
              size="xs"
              name="John Doe"
              src="https://bit.ly/prosper-baba"
              position={"absolute"}
              bottom={"0px"}
              left="4px"
              padding={"2px"}
            />
          </Box>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex justify-between w-full">
            <div className="flex w-full items-center">
              <Text fontSize={"sm"} fontWeight={"bold"}>
                markzuckeberg
              </Text>
              <Image src="/verified.png" w={4} h={4} ml={1} />
            </div>
            <div className="flex gap-4 items-center">
              <Text fontStyle={"sm"} color={"#8e8e8e"}>
                1d
              </Text>
              <BsThreeDots />
            </div>
          </div>

          <Text fontSize={"sm"}>{postTitle}</Text>
          {postImg && (
            <Box
              borderRadius={6}
              overflow={"hidden"}
              border={"1px solid"}
              borderColor={"#8e8e8e"}
            >
              <Image src={postImg} w={"full"} />
            </Box>
          )}

          <div className="flex gap-3 my-1">
            <Actions />
          </div>

          <div className="flex items-center gap-2">
            <Text color={"#8e8e8e"} fontSize={"sm"}>
              {replies} replies
            </Text>
            <Box w={0.5} h={0.5} borderRadius={"full"} bg={"#8e8e8e"}></Box>
            <Text color={"#8e8e8e"} fontSize={"sm"}>
              {likes} likes
            </Text>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default UserPost;
