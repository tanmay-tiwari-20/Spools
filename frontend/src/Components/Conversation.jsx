import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All, BsFillImageFill } from "react-icons/bs";
import { selectedConversationAtom } from "../atoms/messagesAtom";

const Conversation = ({ conversation, isOnline }) => {
  const user = conversation.participants[0];
  const currentUser = useRecoilValue(userAtom);
  const lastMessage = conversation.lastMessage;
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );

  const isSelected = selectedConversation?._id === conversation._id;

  return (
    <div
      className={`flex items-center gap-4 p-2 rounded-full transition-colors cursor-pointer
        ${
          isSelected
            ? "bg-zinc-400 text-white dark:bg-zinc-800 dark:text-white"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }
      `}
      onClick={() =>
        setSelectedConversation({
          _id: conversation._id,
          userId: user._id,
          userProfilePic: user.profilePic,
          username: user.username,
          mock: conversation.mock,
        })
      }
    >
      <div className="relative">
        <img
          className="w-10 h-10 rounded-full object-cover"
          src={user.profilePic}
          alt={`${user.username}'s profile`}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-ebony"></span>
        )}
      </div>

      <div className="flex flex-col text-sm">
        <div
          className={`flex items-center font-semibold ${
            isSelected ? "text-white" : "text-gray-900 dark:text-white"
          }`}
        >
          {user.username}
          <img src="/verified.png" alt="Verified" className="w-4 h-4 ml-1" />
        </div>
        <div
          className={`flex items-center gap-1 text-xs ${
            isSelected ? "text-white" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {currentUser._id === lastMessage.sender && (
            <span
              className={`text-${lastMessage.seen ? "blue-500" : "gray-400"}`}
            >
              <BsCheck2All size={16} />
            </span>
          )}
          {lastMessage.text.length > 18
            ? `${lastMessage.text.substring(0, 18)}...`
            : lastMessage.text || <BsFillImageFill size={16} />}
        </div>
      </div>
    </div>
  );
};

export default Conversation;
