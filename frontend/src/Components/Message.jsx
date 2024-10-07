import { selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All } from "react-icons/bs";
import { useState } from "react";

const Message = ({ ownMessage, message }) => {
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const user = useRecoilValue(userAtom);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className={`flex ${ownMessage ? "justify-end" : ""} mb-3`}>
      {/* Show Avatar only for other users' messages */}
      {!ownMessage && (
        <img
          src={selectedConversation.userProfilePic}
          className="w-8 h-8 mr-1 rounded-full object-cover"
        />
      )}

      {/* Message Content */}
      <div
        className={`flex flex-col items-start ${
          ownMessage ? "mr-2" : "ml-2"
        } max-w-[350px]`}
      >
        {message.text && (
          <div
            className={`flex items-center px-2 py-1 text-sm rounded-full ${
              ownMessage
                ? "dark:bg-softPurple bg-electricBlue text-white"
                : "border"
            }`}
          >
            <p className="m-0">{message.text}</p>
            {/* Message seen icon */}
            <span
              className={`ml-2 ${
                message.seen ? "text-blue-400" : "text-gray-400"
              }`}
            >
              <BsCheck2All size={16} />
            </span>
          </div>
        )}

        {/* Image Messages */}
        {message.img && !imgLoaded && (
          <div className="mt-2 w-[200px] relative">
            <img
              src={message.img}
              hidden
              onLoad={() => setImgLoaded(true)}
              alt="Message image"
              className="rounded-lg"
            />
            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        )}

        {message.img && imgLoaded && (
          <div className="mt-2 w-[200px]">
            <img src={message.img} alt="Message image" className="rounded-lg" />
          </div>
        )}
      </div>

      {/* Show img for own messages */}
      {ownMessage && (
        <img
          src={user.profilePic}
          className="w-8 h-8 ml-1 rounded-full object-cover"
        />
      )}
    </div>
  );
};

export default Message;
