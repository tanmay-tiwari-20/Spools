import {
    Box,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal,
    useToast,
    VStack,
  } from "@chakra-ui/react";
  import { BsInstagram } from "react-icons/bs";
  import { CgMoreO } from "react-icons/cg";
  
  const UserHeader = () => {
    const toast = useToast();
  
    const copyURL = () => {
      const currentURL = window.location.href;
      navigator.clipboard.writeText(currentURL).then(() => {
        toast({
          title: "URL copied to clipboard",
          description: "Profile link copied.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      });
    };
  
    return (
      <VStack
        gap={4}
        alignItems={"start"}
        className="w-full"
      >
        {/* Header section */}
        <div className="flex justify-between w-full items-center">
          <Box>
            <h1 className="font-bold text-lg sm:text-2xl">Mark Zuckerberg</h1>
            <div className="gap-2 flex items-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                markzuckerberg
              </p>
              <p className="rounded-full px-2 py-1 text-xs bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                spools.net
              </p>
            </div>
          </Box>
          <Box>
            <img
              src="/zuck-avatar.png"
              alt="avatar"
              className="rounded-full w-16 h-16 sm:w-20 sm:h-20"
            />
          </Box>
        </div>
  
        {/* Bio section */}
        <p className="mt-2 text-sm sm:text-base text-gray-800 dark:text-gray-300">
          Co-founder, executive chairman and CEO of Meta Platforms.
        </p>
  
        {/* Followers and social link section */}
        <div className="flex justify-between w-full mt-2 items-center">
          <div className="gap-2 flex items-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              3.2k followers
            </p>
            <div className="bg-gray-600 dark:bg-gray-400 w-1 h-1 rounded-full"></div>
            <a
              href=""
              className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
            >
              instagram.com
            </a>
          </div>
          <div className="flex">
            <Box className="icon-container">
              <BsInstagram
                size={24}
                className="cursor-pointer dark:text-gray-200 transition-transform duration-200 hover:scale-110"
              />
            </Box>
            <Box className="icon-container ml-4">
              <Menu>
                <MenuButton>
                  <CgMoreO
                    size={24}
                    className="cursor-pointer dark:text-gray-200 transition-transform duration-200 hover:scale-110"
                  />
                </MenuButton>
                <Portal>
                  <MenuList className="border-none rounded-lg bg-gray-300 dark:bg-ebony">
                    <MenuItem
                      className="duration-300 rounded-md bg-gray-300 dark:bg-gray-600 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
                      onClick={copyURL}
                    >
                      Copy Link
                    </MenuItem>
                  </MenuList>
                </Portal>
              </Menu>
            </Box>
          </div>
        </div>
  
        {/* Tabs section */}
        <div className="flex w-full">
          <div className="flex flex-1 border-b-2 border-b-gray-800 dark:border-b-gray-200 justify-center pb-3 cursor-pointer">
            <p className="font-bold text-gray-800 dark:text-gray-200">Spools</p>
          </div>
          <div className="flex flex-1 border-b-2 border-b-gray-300 dark:border-b-gray-600 justify-center pb-3 cursor-pointer">
            <p className="font-bold text-gray-600 dark:text-gray-400">Replies</p>
          </div>
        </div>
      </VStack>
    );
  };
  
  export default UserHeader;
  