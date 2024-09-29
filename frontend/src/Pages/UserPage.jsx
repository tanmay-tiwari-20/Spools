import { useEffect, useState } from "react";
import UserHeader from "../Components/UserHeader";
import UserPost from "../Components/UserPost";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";

const UserPage = () => {
  const [user, setUser] = useState(null);
  const { username } = useParams();
  const showToast = useShowToast();

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
      }
    };
    getuser();
  }, [username, showToast]);

  if (!user) return null;

  return (
    <>
      <UserHeader user={user} />
      <UserPost
        likes={1200}
        replies={456}
        postImg="/post1.png"
        postTitle="Lets talk about spools."
      />
      <UserPost
        likes={1200}
        replies={456}
        postImg="/post2.png"
        postTitle="Lets talk about spools."
      />
      <UserPost
        likes={1200}
        replies={456}
        postImg="/post3.png"
        postTitle="Lets talk about spools."
      />
      <UserPost likes={1200} replies={456} postTitle="My first spool." />
    </>
  );
};

export default UserPage;
