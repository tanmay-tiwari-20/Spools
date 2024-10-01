import { useEffect, useState } from "react";
import UserHeader from "../Components/UserHeader";
import UserPost from "../Components/UserPost";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";

const UserPage = () => {
  const [user, setUser] = useState(null);
  const { username } = useParams();
  const showToast = useShowToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getuser = async () => {
      try {
        const res = await fetch(`/api/users/profile/${username}`);
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setUser(data);
      } catch (error) {
        showToast("Error", error, "error");
      } finally {
        setLoading(false);
      }
    };
    getuser();
  }, [username, showToast]);

  if (!user && loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loader w-16 h-16 border-4 border-t-transparent border-gray-500 dark:border-softPurple dark:border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user && !loading) return <h1>User not found.</h1>;

  return (
    <>
      <UserHeader user={user} />
      <UserPost
        likes={1200}
        replies={456}
        postImg="/post1.png"
        postTitle="Let's talk about spools."
      />
      <UserPost
        likes={1200}
        replies={456}
        postImg="/post2.png"
        postTitle="Let's talk about spools."
      />
      <UserPost
        likes={1200}
        replies={456}
        postImg="/post3.png"
        postTitle="Let's talk about spools."
      />
      <UserPost likes={1200} replies={456} postTitle="My first spool." />
    </>
  );
};

export default UserPage;
