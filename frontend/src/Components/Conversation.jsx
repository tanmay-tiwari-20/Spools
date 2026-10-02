import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All } from "react-icons/bs";
import { FiImage, FiMic } from "react-icons/fi";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import { formatDistanceToNow } from "date-fns";

const Conversation = ({ conversation, isOnline }) => {
  const user = conversation?.participants?.[0] || {};
  const currentUser = useRecoilValue(userAtom);
  const lastMessage = conversation?.lastMessage || {};
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );

  const isSelected = selectedConversation?._id === conversation?._id;
  const hasUnreadMessage = Boolean(
    lastMessage?.sender &&
      String(lastMessage.sender) !== String(currentUser?._id) &&
      !lastMessage?.seen
  );
  const unreadCount = Math.max(Number(conversation?.unreadCount) || 0, hasUnreadMessage ? 1 : 0);
  const updatedLabel = conversation?.updatedAt
    ? formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: false })
    : "";
  const previewText = lastMessage?.text || (lastMessage?.type === "audio" ? "Voice message" : lastMessage?.sender ? "Photo" : "Start a conversation");

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
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={handleSelectConversation}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
        isSelected
          ? "border-indigo-100 bg-indigo-50/80 text-zinc-900 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-white"
          : "border-transparent text-zinc-700 hover:border-zinc-100 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:border-zinc-800 dark:hover:bg-zinc-800/50"
      }`}
    >
      <div className="relative flex-shrink-0">
        <img
          className="h-12 w-12 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          src={user?.profilePic || "/defaultdp.png"}
          alt={user?.username || "User"}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm" />
        )}
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 truncate font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            <span className="truncate">{user?.username || "Unknown"}</span>
            <img src="/verified.png" alt="Verified" className="w-3.5 h-3.5 flex-shrink-0" />
          </div>
          {updatedLabel && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
              {updatedLabel}
            </span>
          )}
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
          <span className={`flex min-w-0 items-center gap-1.5 truncate ${hasUnreadMessage ? "font-semibold text-zinc-800 dark:text-zinc-100" : ""}`}>
            {lastMessage?.type === "audio" ? <FiMic className="shrink-0" size={13} /> : !lastMessage?.text && lastMessage?.sender && <FiImage className="shrink-0" size={13} />}
            <span className="truncate">{previewText}</span>
          </span>
          {unreadCount > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold leading-none text-white dark:bg-indigo-500">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default Conversation;
