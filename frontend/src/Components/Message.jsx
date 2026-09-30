import { selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilValue } from "recoil";
import { useState } from "react";
import { BsCheck2All } from "react-icons/bs";
import { format } from "date-fns";

const Message = ({ ownMessage, message }) => {
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const [imgLoaded, setImgLoaded] = useState(false);

  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), "h:mm a")
    : "";

  return (
    <div
      className={`flex items-end gap-2 mb-3 max-w-[85%] sm:max-w-[75%] ${
        ownMessage ? "ml-auto flex-row-reverse" : "mr-auto"
      }`}
    >
      {/* Show Avatar only for other users' messages */}
      {!ownMessage && (
        <img
          src={selectedConversation.userProfilePic || "/defaultdp.png"}
          className="w-7 h-7 rounded-full object-cover mb-1 ring-1 ring-zinc-200 dark:ring-zinc-700 flex-shrink-0"
          alt="Avatar"
        />
      )}

      {/* Message Content Container */}
      <div className={`flex flex-col ${ownMessage ? "items-end" : "items-start"}`}>
        {/* Text bubble */}
        {message.text && (
          <div
            className={`px-4 py-2.5 text-sm leading-relaxed transition-all ${
              ownMessage
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-2xl rounded-br-sm shadow-sm"
                : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-2xl rounded-bl-sm"
            }`}
          >
            <p className="m-0 break-words">{message.text}</p>
          </div>
        )}

        {/* Image Messages */}
        {message.img && (
          <div className="mt-1 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-w-[280px]">
            {!imgLoaded && (
              <div className="w-[260px] h-[180px] bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl" />
            )}
            <img
              src={message.img}
              onLoad={() => setImgLoaded(true)}
              alt="Message media"
              className={`w-full h-auto object-cover max-h-[300px] ${
                !imgLoaded ? "hidden" : "block"
              }`}
            />
          </div>
        )}

        {/* Timestamp and Seen Status */}
        <div
          className={`flex items-center gap-1 mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 px-1`}
        >
          {formattedTime && <span>{formattedTime}</span>}
          {ownMessage && (
            <span className={message.seen ? "text-blue-500" : "text-zinc-400"}>
              <BsCheck2All size={14} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
