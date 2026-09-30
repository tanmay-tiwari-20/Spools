import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { IoCloseCircle } from "react-icons/io5";
import useShowToast from "../hooks/useShowToast";
import SuggestedUsers from "../Components/SuggestedUsers";

const SearchPage = () => {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const showToast = useShowToast();

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search/${searchText.trim()}`);
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  return (
    <div className="max-w-xl mx-auto pt-2 pb-16 w-full">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="relative w-full mb-6">
        <FiSearch
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search for people on Spools..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-11 pr-10 py-3 text-sm md:text-base rounded-2xl bg-zinc-100 dark:bg-zinc-850/80 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all shadow-sm"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => setSearchText("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <IoCloseCircle size={18} />
          </button>
        )}
      </form>

      {/* Loading Skeleton */}
      {isSearching && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 animate-pulse border border-zinc-100 dark:border-zinc-800/60"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-28 h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-2 mb-3">
            Search Results ({searchResults.length})
          </h3>
          {searchResults.map((user) => (
            <Link
              key={user._id}
              to={`/${user.username}`}
              className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 group"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.profilePic || "/defaultdp.png"}
                  alt={user.name}
                  className="w-11 h-11 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:underline">
                      {user.username}
                    </span>
                    <img src="/verified.png" alt="Verified" className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.name}</p>
                </div>
              </div>

              <span className="text-xs font-semibold px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900 transition-colors">
                View
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* No results */}
      {!isSearching && searchResults.length === 0 && searchText && (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-sm font-medium">No users found matching &ldquo;{searchText}&rdquo;</p>
          <p className="text-xs mt-1 text-zinc-500">Try searching with another name or username.</p>
        </div>
      )}

      {/* Empty Search: Suggested Users */}
      {!searchText && (
        <div className="mt-4">
          <SuggestedUsers />
        </div>
      )}
    </div>
  );
};

export default SearchPage;
