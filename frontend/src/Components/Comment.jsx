import { Link } from "react-router-dom";

const Comment = ({ reply, lastReply }) => {
  return (
    <div
      className={`py-3.5 flex gap-3 ${
        !lastReply ? "border-b border-zinc-100 dark:border-zinc-800/60" : ""
      }`}
    >
      <Link to={`/${reply.username}`} className="flex-shrink-0">
        <img
          src={reply.userProfilePic || "/defaultdp.png"}
          alt={reply.username}
          className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
        />
      </Link>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Link
            to={`/${reply.username}`}
            className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:underline truncate"
          >
            {reply.username}
          </Link>
          <img src="/verified.png" alt="Verified" className="w-3.5 h-3.5" />
        </div>

        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {reply.text}
        </p>
      </div>
    </div>
  );
};

export default Comment;
