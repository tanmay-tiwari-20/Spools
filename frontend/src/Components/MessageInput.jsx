import { Input, InputGroup, InputRightElement } from "@chakra-ui/react"
import { IoSendSharp } from "react-icons/io5"

const MessageInput = () => {
  return (
    <form>
        <InputGroup>
          <Input type="text" placeholder="Write a message..." />
          <InputRightElement>
            <IoSendSharp className="text-softPurple" />
          </InputRightElement>
        </InputGroup>
    </form>
  )
}

export default MessageInput