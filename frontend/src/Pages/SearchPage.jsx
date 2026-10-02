import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";
import SuggestedUsers from "../Components/SuggestedUsers";

const SearchPage = () => {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const requestId = useRef(0);
  const showToast = useShowToast();

  const searchUsers = useCallback(async (query, requestKey = null) => {
    const normalizedQuery = query.trim();
    const currentRequest = requestKey ?? ++requestId.current;
    if (requestKey !== null && requestKey !== requestId.current) return;

    if (!normalizedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search/${encodeURIComponent(normalizedQuery)}`);
      const data = await res.json();
      if (currentRequest !== requestId.current) return;
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      if (currentRequest === requestId.current) showToast("Error", error.message, "error");
    } finally {
      if (currentRequest === requestId.current) setIsSearching(false);
    }
  }, [showToast]);

  useEffect(() => {
    const query = searchText.trim();
    const requestKey = ++requestId.current;

    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    setSearchResults([]);
    setIsSearching(true);
    const delayDebounce = setTimeout(() => searchUsers(query, requestKey), 350);
    return () => clearTimeout(delayDebounce);
  }, [searchText, searchUsers]);

  const clearSearch = () => {
    requestId.current += 1;
    setSearchText("");
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-1 pb-16 pt-3">
      <h1 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">Search</h1>

      <form role="search" onSubmit={(event) => { event.preventDefault(); searchUsers(searchText); }} className="relative">
        <FiSearch aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search people by name or username"
          aria-label="Search people by name or username"
          className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-11 text-sm text-zinc-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-zinc-900 dark:focus:ring-indigo-950"
        />
        {searchText && (
          <button type="button" onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
            <FiX size={17} />
          </button>
        )}
      </form>

      {!searchText.trim() && (
        <section className="mt-6">
          <SuggestedUsers />
        </section>
      )}

      <section aria-live="polite" className="mt-5">
        {isSearching ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex animate-pulse items-center gap-3 py-3">
                <div className="h-11 w-11 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-2"><div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800" /><div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800/70" /></div>
              </div>
            ))}
          </div>
        ) : searchText.trim() && searchResults.length ? (
          <>
            <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {searchResults.length} {searchResults.length === 1 ? "person" : "people"}
            </p>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {searchResults.map((user) => (
                <Link key={user._id} to={`/${user.username}`} className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <img src={user.profilePic || "/defaultdp.png"} alt={user.name || user.username} className="h-11 w-11 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">@{user.username}</p>
                    <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{user.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : searchText.trim() ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No people found for “{searchText.trim()}”.</p>
        ) : null}
      </section>
    </main>
  );
};

export default SearchPage;
