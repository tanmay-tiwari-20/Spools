import {
  Avatar,
  AvatarBadge,
  Image,
  Stack,
  Text,
  WrapItem,
} from "@chakra-ui/react";

const Conversation = () => {
  return (
    <div className="flex gap-4 items-center p-1 hover:cursor-pointer hover:bg-gray-600 hover:dark:bg-gray-600 rounded-md">
      <WrapItem>
        <Avatar
          size={{
            base: "xs",
            sm: "sm",
            md: "md",
          }}
          src="defaultdp.png"
        >
          <AvatarBadge boxSize="1em" bg="green.500" />
        </Avatar>
      </WrapItem>

      <Stack direction={"column"} fontSize={"sm"}>
        <Text fontWeight="700" display={"flex"} alignItems={"center"}>
          John Doe <Image src="/verified.png" w={4} h={4} ml={1} />
        </Text>
        <Text fontSize={"xs"} display={"flex"} alignItems={"center"} gap={1}>
            Hello....
        </Text>
      </Stack>
    </div>
  );
};

export default Conversation;
