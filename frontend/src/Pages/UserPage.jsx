import { useEffect, useState } from "react";
import UserHeader from "../Components/UserHeader";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import { Flex, Spinner } from "@chakra-ui/react";
import Post from "../Components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";

const UserPage = () => {
	const { user, loading } = useGetUserProfile();
	const { username } = useParams();
	const showToast = useShowToast();
	const [posts, setPosts] = useRecoilState(postsAtom);
	const [fetchingPosts, setFetchingPosts] = useState(true);
	const [activeTab, setActiveTab] = useState("spools");

	useEffect(() => {
		const getPosts = async () => {
			if (!user) return;
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
					<p className="text-base font-medium">
						{activeTab === "spools" && "This user has not posted any spools yet."}
						{activeTab === "replies" && "No replies found."}
						{activeTab === "saved" && "You haven't saved any spools yet."}
					</p>
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