import { useEffect, useState } from "react";
import UserHeader from "../Components/UserHeader";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import { Flex, Spinner } from "@chakra-ui/react";
import Post from "../Components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import { setShareMetadata } from "../utils/shareMetadata";

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
			<Flex justifyContent={"center"} my={16}>
				<Spinner size={"xl"} />
			</Flex>
		);
	}

	if (!user && !loading) return <h1 className="text-center text-lg my-12 font-semibold">User not found</h1>;

	return (
		<>
			<UserHeader user={user} activeTab={activeTab} setActiveTab={setActiveTab} />

			{!fetchingPosts && posts.length === 0 && (
				<div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
					{user.canViewContent === false ? <div className="mx-auto max-w-sm rounded-3xl border border-zinc-200 bg-zinc-50 px-6 py-8 dark:border-zinc-800 dark:bg-zinc-900/70"><h2 className="font-bold text-zinc-900 dark:text-white">This profile is private</h2><p className="mt-2 text-sm font-normal">Follow @{user.username} and wait for approval to see their Spools, replies, and people lists.</p></div> : <p className="text-base font-medium">
						{activeTab === "spools" && "This user has not posted any spools yet."}
						{activeTab === "replies" && "No replies found."}
						{activeTab === "saved" && "You haven't saved any spools yet."}
					</p>}
				</div>
			)}
			{fetchingPosts && (
				<Flex justifyContent={"center"} my={12}>
					<Spinner size={"xl"} />
				</Flex>
			)}

			{!fetchingPosts &&
				posts.map((post) => (
					<Post key={post._id} post={post} postedBy={post.postedBy} />
				))}
		</>
	);
};

export default UserPage;
