import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All } from "react-icons/bs";
import { selectedConversationAtom } from "../atoms/messagesAtom";

const Conversation = ({ conversation, isOnline }) => {
  const user = conversation?.participants?.[0] || {};
  const currentUser = useRecoilValue(userAtom);
  const lastMessage = conversation?.lastMessage || {};
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );

  const isSelected = selectedConversation?._id === conversation?._id;

  const handleSelectConversation = () => {
    setSelectedConversation({
      _id: conversation?._id,
      userId: user?._id,
      userProfilePic: user?.profilePic,
      username: user?.username,
      mock: conversation?.mock,
    });
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300"
      }`}
      onClick={handleSelectConversation}
    >
      <div className="relative flex-shrink-0">
        <img
          className="w-11 h-11 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          src={user?.profilePic || "/defaultdp.png"}
          alt={user?.username || "User"}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm" />
        )}
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 truncate font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            <span className="truncate">{user?.username || "Unknown"}</span>
            <img src="/verified.png" alt="Verified" className="w-3.5 h-3.5 flex-shrink-0" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
          {currentUser?._id === lastMessage?.sender && (
            <span
              className={
                lastMessage?.seen
                  ? "text-blue-500 flex-shrink-0"
                  : "text-zinc-400 flex-shrink-0"
              }
            >
              <BsCheck2All size={15} />
            </span>
          )}
          <span className="truncate">
            {lastMessage?.text || (lastMessage?.sender ? "Attachment" : "Start chatting...")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
