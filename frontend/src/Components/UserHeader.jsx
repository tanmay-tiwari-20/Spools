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
import { CgMoreO } from "react-icons/cg";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link, Link as RouterLink } from "react-router-dom";
import { useState } from "react";
import useShowToast from "../hooks/useShowToast";

const UserHeader = ({ user }) => {
  const showToast = useShowToast();
  const toast = useToast();
  const currentUser = useRecoilValue(userAtom); // logged in user
  const [following, setFollowing] = useState(
    user.followers.includes(currentUser?._id)
  );
  const [updating, setUpdating] = useState(false);

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

  const handleFollowUnfollow = async () => {
    if (!currentUser) {
      showToast(
        "Error",
        "You need to be logged in to follow or unfollow users",
        "error"
      );
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/users/follow/${user._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      if (following) {
        showToast("Success", `Unfollowed ${user.name}`, "success");
        user.followers.pop(); // simulate removing from followers
      } else {
        showToast("Success", `Followed ${user.name}`, "success");
        user.followers.push(currentUser?._id); // simulate adding to followers
      }
      setFollowing(!following);
    } catch (error) {
      showToast("Error", error, "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <VStack gap={4} alignItems={"start"} className="w-full">
      {/* Header section */}
      <div className="flex justify-between w-full items-center">
        <Box>
          <h1 className="font-bold lg:text-4xl text-2xl mb-2">{user.name}</h1>
          <div className="gap-2 flex items-center">
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300">
              @{user.username}
            </p>
            <p className="rounded-full select-none px-2 py-1 text-xs bg-gray-300 dark:bg-softPurple text-gray-700 dark:text-gray-200">
              spools.net
            </p>
          </div>
        </Box>
        <Box>
          <img
            src={user.profilePic ? user.profilePic : "defaultdp.png"}
            alt="avatar"
            className="rounded-full object-cover lg:w-24 lg:h-24 w-20 h-20"
          />
        </Box>
      </div>

      {/* Bio section */}
      <p className="text-sm sm:text-base text-gray-800 dark:text-gray-300">
        {user.bio}
      </p>

      {currentUser?._id === user._id && (
        <Link as={RouterLink} to="/update">
          <button className="rounded-full bg-gray-300 hover:bg-zinc-50 dark:bg-softPurple dark:hover:bg-softPurple/90 text-gray-700 dark:text-gray-200 h-8 w-32 shadow-xl transition-all duration-300 hover:shadow-electricBlue dark:hover:shadow-softPurple">
            Update Profile
          </button>
        </Link>
      )}

      {currentUser?._id !== user._id && (
        <button
          className="flex justify-center items-center rounded-full shadow-md bg-gray-300 hover:bg-zinc-50 dark:bg-softPurple dark:hover:bg-softPurple/90 text-gray-700 dark:text-gray-200 h-8 w-24"
          onClick={handleFollowUnfollow}
          disabled={updating}
        >
          {updating ? (
            <svg
              className="animate-spin h-5 w-5 text-gray-700 dark:text-gray-200"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
          ) : following ? (
            "Unfollow"
          ) : (
            "Follow"
          )}
        </button>
      )}

      {/* Followers and social link section */}
      <div className="flex justify-between w-full mt-2 items-center">
        <div className="gap-2 flex items-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {user.followers.length} followers
          </p>
          <div className="bg-gray-600 dark:bg-gray-400 w-1 h-1 rounded-full"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {user.following.length} following
          </p>
        </div>
        <div className="flex">
          <Box className="icon-container rounded-full p-2 w-10 h-10 transition-all duration-300 ease-linear hover:bg-gradient-to-r hover:from-electricBlue hover:to-softPurple hover:text-white ml-4">
            <Menu>
              <MenuButton>
                <CgMoreO
                  size={24}
                  className="cursor-pointer dark:text-gray-200 transition-transform duration-200 hover:scale-110"
                />
              </MenuButton>
              <Portal>
                <MenuList border={"none"} bg={""}>
                  <MenuItem
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    w={32}
                    bgGradient="linear(to-r, #0095f6, #9b51e0)"
                    color="white"
                    transitionDuration="300ms"
                    borderRadius="full"
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
