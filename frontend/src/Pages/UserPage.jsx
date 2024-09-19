import UserHeader from "../Components/UserHeader";
import UserPost from "../Components/UserPost";

const UserPage = () => {
  return (
    <>
      <UserHeader />
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
