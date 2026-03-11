import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SearchIcon } from "@chakra-ui/icons";
import {
  Input,
  InputGroup,
  InputRightElement,
  Box,
  Flex,
  Text,
  Avatar,
  Button,
  Spinner,
  SkeletonCircle,
  Skeleton,
} from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import SuggestedUsers from "../Components/SuggestedUsers";

const SearchPage = () => {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const showToast = useShowToast();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search/${searchText}`);
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      setSearchResults(data);
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText) {
        handleSearch({ preventDefault: () => {} });
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  return (
    <Box maxW="600px" mx="auto" pt={4} w="full">
      <form onSubmit={handleSearch}>
        <InputGroup>
          <Input
            placeholder="Search for users..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            bg="white"
            dark={{ bg: "gray.800" }}
            color="black"
            _dark={{ color: "white" }}
            borderRadius="full"
            py={6}
            pl={6}
            boxShadow="sm"
            _focus={{ boxShadow: "md", borderColor: "gray.400" }}
          />
          <InputRightElement width="4.5rem" h="full">
            <Button
              h="2rem"
              size="sm"
              onClick={handleSearch}
              isLoading={isSearching}
              variant="ghost"
              borderRadius="full"
            >
              {!isSearching && <SearchIcon color="gray.500" />}
            </Button>
          </InputRightElement>
        </InputGroup>
      </form>

      <Box mt={6}>
        {isSearching && (
          <Flex flexDir="column" gap={4}>
            {[...Array(3)].map((_, i) => (
              <Flex key={i} gap={2} alignItems="center" p={2}>
                <SkeletonCircle size="10" />
                <Flex direction="column" gap={2} flex={1}>
                  <Skeleton height="10px" width="120px" />
                  <Skeleton height="10px" width="80px" />
                </Flex>
              </Flex>
            ))}
          </Flex>
        )}

        {!isSearching && searchResults.length > 0 && (
          <Flex direction="column" gap={4}>
            <Text fontWeight="bold" color="gray.500" mb={2}>
              Search Results
            </Text>
            {searchResults.map((user) => (
              <Flex
                key={user._id}
                justifyContent="space-between"
                alignItems="center"
                p={2}
                _hover={{ bg: "gray.100", _dark: { bg: "gray.800" } }}
                borderRadius="md"
                transition="all 0.2s"
              >
                <Flex
                  gap={2}
                  alignItems="center"
                  as={Link}
                  to={`/${user.username}`}
                >
                  <Avatar src={user.profilePic} name={user.name} size="md" />
                  <Box>
                    <Text fontSize="sm" fontWeight="bold">
                      {user.username}
                    </Text>
                    <Text color="gray.500" fontSize="sm">
                      {user.name}
                    </Text>
                  </Box>
                </Flex>
                <Link to={`/${user.username}`}>
                  <Button size="sm" variant="outline" colorScheme="blue">
                    View
                  </Button>
                </Link>
              </Flex>
            ))}
          </Flex>
        )}

        {!isSearching && searchResults.length === 0 && searchText && (
          <Text textAlign="center" color="gray.500" mt={10}>
            No users found matching "{searchText}"
          </Text>
        )}

        {!searchText && (
          <Box mt={6}>
            <SuggestedUsers />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SearchPage;
