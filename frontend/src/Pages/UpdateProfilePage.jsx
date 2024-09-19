import {
    Avatar,
    AvatarBadge,
    Button,
    Center,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    IconButton,
    Input,
    Stack,
    useColorModeValue,
  } from "@chakra-ui/react";
  import { SmallCloseIcon } from "@chakra-ui/icons";
  import { useState } from "react";
  
  export default function UpdateProfilePage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
  
    const bgColor = useColorModeValue('bg-light', 'bg-dark');
    const formBgColor = useColorModeValue('form-light', 'form-dark');
    const labelColor = useColorModeValue('label-light', 'label-dark');
    const placeholderColor = useColorModeValue('placeholder-light', 'placeholder-dark');
    
    return (
      <Flex
        align="center"
        justify="center"
        bg={formBgColor}
        p={{ base: 4, md: 8 }}
      >
        <Stack
          spacing={6}
          w="full"
          maxW="md"
          bg={bgColor}
          rounded="xl"
          shadow="lg"
          p={{ base: 6, md: 8 }}
        >
          <Heading
            lineHeight={1.3}
            fontSize={{ base: "2xl", sm: "3xl" }}
            color={labelColor}
            textAlign="center"
          >
            Edit Profile
          </Heading>
  
          {/* User Avatar */}
          <FormControl id="userIcon">
            <FormLabel fontSize="sm" color={labelColor}>
              Profile Picture
            </FormLabel>
            <Stack direction={["column", "row"]} spacing={6} align="center">
              <Center>
                <Avatar size="xl" src="https://bit.ly/sage-adebayo">
                  <AvatarBadge
                    as={IconButton}
                    size="sm"
                    rounded="full"
                    top="-10px"
                    bg="red.500"
                    aria-label="Remove Image"
                    icon={<SmallCloseIcon />}
                  />
                </Avatar>
              </Center>
              <Center w="full">
                <Button variant="outline" className="btn-change-pic w-full">
                  Change Picture
                </Button>
              </Center>
            </Stack>
          </FormControl>
  
          {/* Username */}
          <FormControl id="userName" isRequired>
            <FormLabel fontSize="sm" color={labelColor}>
              Username
            </FormLabel>
            <Input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              _placeholder={{ color: placeholderColor }}
              bg={formBgColor}
              color={labelColor}
              className="border focus:border-primary"
            />
          </FormControl>
  
          {/* Email */}
          <FormControl id="email" isRequired>
            <FormLabel fontSize="sm" color={labelColor}>
              Email Address
            </FormLabel>
            <Input
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              _placeholder={{ color: placeholderColor }}
              bg={formBgColor}
              color={labelColor}
              className="border focus:border-primary"
            />
          </FormControl>
  
          {/* Password */}
          <FormControl id="password" isRequired>
            <FormLabel fontSize="sm" color={labelColor}>
              Password
            </FormLabel>
            <Input
              placeholder="Enter new password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              _placeholder={{ color: placeholderColor }}
              bg={formBgColor}
              color={labelColor}
              className="border focus:border-primary"
            />
          </FormControl>
  
          {/* Buttons */}
          <Stack spacing={6} direction={["column", "row"]}>
            <Button className="btn-cancel w-full">
              Cancel
            </Button>
            <Button className="btn-save w-full">
              Save Changes
            </Button>
          </Stack>
        </Stack>
      </Flex>
    );
  }
  