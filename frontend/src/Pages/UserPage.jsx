import { useEffect, useState } from "react";
import UserHeader from "../Components/UserHeader";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import Post from "../Components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import { setShareMetadata } from "../utils/shareMetadata";
import { FiLock, FiMessageCircle, FiBookmark } from "react-icons/fi";

const UserPage = () => {
	const { user, loading } = useGetUserProfile();
	const { username } = useParams();
	const showToast = useShowToast();
	const [posts, setPosts] = useRecoilState(postsAtom);
	const [fetchingPosts, setFetchingPosts] = useState(true);
	const [activeTab, setActiveTab] = useState("spools");

	useEffect(() => {
		if (!user || loading) return;
		const hasProfilePicture = Boolean(user.profilePic);
		setShareMetadata({
			title: hasProfilePicture && user.name ? `${user.name} (@${user.username}) · Spools` : `@${user.username} · Spools`,
			description: hasProfilePicture && user.bio?.trim() ? user.bio.trim().slice(0, 240) : `View @${user.username}'s profile on Spools.`,
			url: `${window.location.origin}/${encodeURIComponent(user.username)}`,
			image: user.profilePic || null,
			type: "profile",
			username: user.username,
		});
	}, [user, loading]);

	useEffect(() => {
		const getPosts = async () => {
			if (!user) return;
			if (user.canViewContent === false) {
				setPosts([]);
				setFetchingPosts(false);
				return;
			}
			setFetchingPosts(true);
			try {
				let endpoint = `/api/posts/user/${username}`;
				if (activeTab === "replies") {
					endpoint = `/api/posts/replies/${username}`;
				} else if (activeTab === "saved") {
					endpoint = `/api/posts/saved`;
				}

				const res = await fetch(endpoint);
				const data = await res.json();
				if (data.error) {
					showToast("Error", data.error, "error");
					setPosts([]);
					return;
				}
				setPosts(Array.isArray(data) ? data : []);
			} catch (error) {
				showToast("Error", error.message, "error");
				setPosts([]);
			} finally {
				setFetchingPosts(false);
			}
		};

		getPosts();
	}, [username, showToast, setPosts, user, activeTab]);

	if (!user && loading) {
		return (
			<div className="mx-auto flex max-w-3xl justify-center py-20">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-300 dark:border-t-transparent" />
			</div>
		);
	}

	if (!user && !loading) return <h1 className="my-12 text-center text-lg font-semibold text-zinc-700 dark:text-zinc-300">User not found</h1>;

	return (
		<main className="mx-auto max-w-3xl space-y-4 pb-12">
			<UserHeader user={user} activeTab={activeTab} setActiveTab={setActiveTab} />

			{!fetchingPosts && posts.length === 0 && (
				<div className="rounded-3xl border border-zinc-200/80 bg-white px-5 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/60 sm:py-14">
					{user.canViewContent === false ? (
						<>
							<span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><FiLock size={20} /></span>
							<h2 className="mt-4 font-bold text-zinc-900 dark:text-white">This profile is private</h2>
							<p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">Follow @{user.username} and wait for approval to see their Spools, replies, and people lists.</p>
						</>
					) : (
						<>
							<span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">{activeTab === "saved" ? <FiBookmark size={20} /> : <FiMessageCircle size={20} />}</span>
							<h2 className="mt-4 font-bold text-zinc-900 dark:text-white">{activeTab === "spools" ? "No Spools yet" : activeTab === "replies" ? "No replies yet" : "Nothing saved yet"}</h2>
							<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{activeTab === "spools" ? "Their posts will show up here." : activeTab === "replies" ? "Replies from this profile will show up here." : "Spools you save will show up here."}</p>
						</>
					)}
				</div>
			)}
			{fetchingPosts && (
				<div className="flex justify-center py-12">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-300 dark:border-t-transparent" />
				</div>
			)}

			{!fetchingPosts &&
				posts.map((post) => (
					<Post key={post._id} post={post} postedBy={post.postedBy} />
				))}
		</main>
	);
};

export default UserPage;
