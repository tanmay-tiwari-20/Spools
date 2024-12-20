import { selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilValue } from "recoil";
import { useState } from "react";

const Message = ({ ownMessage, message }) => {
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className={`flex ${ownMessage ? "justify-end" : ""} mb-3`}>
      {/* Show Avatar only for other users' messages */}
      {!ownMessage && (
        <img
          src={selectedConversation.userProfilePic || "defaultdp.png"}
          className="w-8 h-8 mr-1 rounded-full object-cover"
          alt="User avatar"
        />
      )}

      {/* Message Content */}
      <div
        className={`flex flex-col items-start ${
          ownMessage ? "mr-2" : "ml-2"
        } max-w-[350px]`}
      >
        {message.text && (
          <div className="flex items-center">
            <div
              className={`flex items-center px-3 py-2 text-sm rounded-3xl ${
                ownMessage
                  ? "dark:border-softPurple border border-electricBlue"
                  : "border"
              }`}
            >
              <p className="m-0">{message.text}</p>
            </div>
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
    </div>
  );
};

export default Message;
