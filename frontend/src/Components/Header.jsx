import { useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AiFillHome, AiOutlineHome } from "react-icons/ai";
import { FiBookOpen, FiLogOut, FiSearch, FiSettings, FiUsers } from "react-icons/fi";
import { IoChatbubbleEllipsesSharp, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext.jsx";

const Header = ({ isDarkMode: propIsDark, toggleColorMode: propToggle }) => {
  const user = useRecoilValue(userAtom);
  const [conversations, setConversations] = useRecoilState(conversationsAtom);
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const { socket } = useSocket();
  const logout = useLogout();
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const location = useLocation();
  const themeContext = useTheme();

  const isDarkMode = propIsDark !== undefined ? propIsDark : themeContext?.isDarkMode;
  const toggleColorMode = propToggle || themeContext?.toggleColorMode;

  const isHome = location.pathname === "/";
  const isSearch = location.pathname === "/search";
  const isChat = location.pathname === "/chat";
  const isChatConversationOpen = isChat && Boolean(selectedConversation?._id);
  const isSettings = location.pathname === "/settings";
  const isCircles = location.pathname.startsWith("/circles");
  const isSeries = location.pathname.startsWith("/series");
  const isProfile = user && location.pathname === `/${user.username}`;
  const unreadConversationCount = conversations.reduce((count, conversation) => {
    const hasUnread = String(conversation?.lastMessage?.sender) !== String(user?._id) &&
      Boolean(conversation?.lastMessage?.sender) && !conversation?.lastMessage?.seen;
    return count + (Math.max(Number(conversation?.unreadCount) || 0, hasUnread ? 1 : 0) > 0 ? 1 : 0);
  }, 0);

  useEffect(() => {
    if (!user?._id) return undefined;
    let cancelled = false;
    fetch("/api/messages/conversations")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setConversations(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?._id, setConversations]);

  useEffect(() => {
    if (!socket || !user?._id) return undefined;
    const handleNewMessage = (message) => {
      const conversationId = String(message.conversationId || "");
      const senderId = String(message.sender || "");
      const isViewingConversation = location.pathname === "/chat" &&
        String(selectedConversation?._id) === conversationId;

      setConversations((previous) => {
        let found = false;
        const updated = previous.map((conversation) => {
          const matchesId = String(conversation?._id) === conversationId;
          const matchesParticipant = String(conversation?.participants?.[0]?._id) === senderId;
          if (!matchesId && !matchesParticipant) return conversation;
          found = true;
          return {
            ...conversation,
            _id: conversationId || conversation._id,
            mock: false,
            unreadCount: isViewingConversation ? 0 : (Number(conversation.unreadCount) || 0) + 1,
          };
        });
        if (!found && message.senderProfile) {
          updated.push({
            _id: conversationId,
            updatedAt: message.createdAt || new Date().toISOString(),
            lastMessage: {
              text: message.text || (message.audio ? "Voice message" : message.img ? "Photo" : ""),
              sender: message.sender,
              type: message.audio ? "audio" : message.img ? "image" : "text",
              seen: false,
            },
            unreadCount: isViewingConversation ? 0 : 1,
            participants: [message.senderProfile],
          });
        }
        return updated;
      });
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, user?._id, location.pathname, selectedConversation?._id, setConversations]);

  const primaryLinkClass = (active) => `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
    active
      ? "bg-white text-indigo-700 shadow-sm dark:bg-zinc-800 dark:text-indigo-200"
      : "text-zinc-500 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-white"
  }`;
  const communityLinkClass = (active) => `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
    active
      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200"
      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
  }`;

  return (
    <>
      <header className={`sticky top-0 z-40 mb-3 w-full rounded-2xl border border-zinc-200/80 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:shadow-black/20 sm:mb-4 sm:px-4 ${isHome ? "" : "hidden md:block"}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={toggleColorMode}
              className="shrink-0 rounded-xl p-1 transition hover:bg-zinc-100 active:scale-95 dark:hover:bg-zinc-800"
              title={`Spools • Click logo to switch to ${isDarkMode ? "Light" : "Dark"} mode`}
              aria-label="Click Spools logo to toggle theme"
            >
              <img src="/dark-mode.svg" alt="Spools Logo" className="h-8 w-8 object-contain dark:hidden" />
              <img src="/light-mode.svg" alt="Spools Logo" className="hidden h-8 w-8 object-contain dark:block" />
            </button>
            <RouterLink to="/" className="select-none text-lg font-extrabold tracking-tight text-zinc-950 transition-opacity hover:opacity-75 dark:text-white sm:text-xl" title="Spools Home">
              Spools
            </RouterLink>
          </div>

          {user ? (
            <>
              <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-2xl border border-zinc-200/70 bg-zinc-100/80 p-1 dark:border-zinc-700/80 dark:bg-zinc-900 md:flex">
                <RouterLink to="/" className={`${primaryLinkClass(isHome)} px-2 lg:px-3`} aria-current={isHome ? "page" : undefined}>
                  {isHome ? <AiFillHome size={18} /> : <AiOutlineHome size={18} />} <span className="hidden lg:inline">Home</span>
                </RouterLink>
                <RouterLink to="/search" className={`${primaryLinkClass(isSearch)} px-2 lg:px-3`} aria-current={isSearch ? "page" : undefined}>
                  <FiSearch size={17} /> <span className="hidden lg:inline">Search</span>
                </RouterLink>
                <RouterLink to="/chat" className={`${primaryLinkClass(isChat)} px-2 lg:px-3`} aria-current={isChat ? "page" : undefined}>
                  <span className="relative">
                    {isChat ? <IoChatbubbleEllipsesSharp size={18} /> : <IoChatbubbleEllipsesOutline size={18} />}
                    {unreadConversationCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-zinc-100 dark:ring-zinc-900">{unreadConversationCount > 99 ? "99+" : unreadConversationCount}</span>}
                  </span>
                  <span className="hidden lg:inline">Messages</span>
                </RouterLink>
              </nav>

              <nav aria-label="Community" className="hidden items-center gap-1 md:flex">
                <RouterLink to="/circles" className={communityLinkClass(isCircles)} aria-current={isCircles ? "page" : undefined}>
                  <FiUsers size={15} /> <span className="hidden lg:inline">Circles</span>
                </RouterLink>
                <RouterLink to="/series" className={communityLinkClass(isSeries)} aria-current={isSeries ? "page" : undefined}>
                  <FiBookOpen size={15} /> <span className="hidden lg:inline">Series</span>
                </RouterLink>
              </nav>
            </>
          ) : (
            <div className="hidden text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:block">Welcome to the conversation</div>
          )}

          <div className="flex shrink-0 items-center gap-1.5">
            {user ? (
              <>
                <RouterLink
                  to="/settings"
                  className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${isSettings ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"}`}
                  title="Settings"
                  aria-label="Settings"
                  aria-current={isSettings ? "page" : undefined}
                >
                  <FiSettings size={19} />
                </RouterLink>
                <button onClick={logout} className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300 sm:inline-flex" title="Log out">
                  <FiLogOut size={16} /> <span>Log out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <RouterLink to="/auth" onClick={() => setAuthScreen("login")} className="inline-flex min-h-10 items-center justify-center rounded-full border border-zinc-200 bg-white/70 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:px-4 sm:text-sm">Log in</RouterLink>
                <RouterLink to="/auth" onClick={() => setAuthScreen("signup")} className="inline-flex min-h-10 items-center justify-center rounded-full bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:px-4 sm:text-sm">Sign up</RouterLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {user && isHome && (
        <nav aria-label="Community features" className="-mt-1 mb-3 grid grid-cols-2 gap-2 px-0.5 md:hidden">
          <RouterLink to="/circles" aria-current={isCircles ? "page" : undefined} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors ${isCircles ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200" : "border-zinc-200/80 bg-white/90 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}>
            <FiUsers size={14} /> Circles
          </RouterLink>
          <RouterLink to="/series" aria-current={isSeries ? "page" : undefined} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors ${isSeries ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200" : "border-zinc-200/80 bg-white/90 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}>
            <FiBookOpen size={14} /> Series
          </RouterLink>
        </nav>
      )}

      {user && (!isChat || !isChatConversationOpen) && (
        <nav aria-label="Quick navigation" className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-50 flex items-center justify-around rounded-2xl border border-zinc-200/90 bg-white/95 px-3 py-2 shadow-xl shadow-zinc-950/10 backdrop-blur-xl dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:shadow-black/30 sm:left-4 sm:right-4 md:hidden">
          <RouterLink to="/" aria-label="Home" aria-current={isHome ? "page" : undefined} className={`grid h-10 w-12 place-items-center rounded-xl transition-colors ${isHome ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200" : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}>
            {isHome ? <AiFillHome size={22} /> : <AiOutlineHome size={22} />}
          </RouterLink>
          <RouterLink to="/search" aria-label="Search" aria-current={isSearch ? "page" : undefined} className={`grid h-10 w-12 place-items-center rounded-xl transition-colors ${isSearch ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200" : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}>
            <FiSearch size={21} />
          </RouterLink>
          <RouterLink to="/chat" aria-label="Messages" aria-current={isChat ? "page" : undefined} className={`grid h-10 w-12 place-items-center rounded-xl transition-colors ${isChat ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200" : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}>
            <span className="relative">
              {isChat ? <IoChatbubbleEllipsesSharp size={21} /> : <IoChatbubbleEllipsesOutline size={21} />}
              {unreadConversationCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-zinc-900">{unreadConversationCount > 99 ? "99+" : unreadConversationCount}</span>}
            </span>
          </RouterLink>
          <RouterLink to={`/${user.username}`} aria-label="Your profile" aria-current={isProfile ? "page" : undefined} className="grid h-10 w-12 place-items-center rounded-xl transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <img src={user.profilePic || "/defaultdp.png"} alt="" className={`h-6 w-6 rounded-full object-cover ${isProfile ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900" : ""}`} />
          </RouterLink>
        </nav>
      )}
    </>
  );
};

export default Header;
