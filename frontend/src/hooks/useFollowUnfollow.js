import { useEffect, useState } from "react";
import useShowToast from "./useShowToast";
import userAtom from "../atoms/userAtom";
import { useRecoilValue } from "recoil";

const useFollowUnfollow = (user) => {
  const currentUser = useRecoilValue(userAtom);
  const [following, setFollowing] = useState(Boolean(user.isFollowing));
  const [requestPending, setRequestPending] = useState(Boolean(user.followRequestPending));
  const [updating, setUpdating] = useState(false);
  const showToast = useShowToast();

  useEffect(() => {
    setFollowing(Boolean(user.isFollowing));
    setRequestPending(Boolean(user.followRequestPending));
  }, [user._id, user.isFollowing, user.followRequestPending]);

  const handleFollowUnfollow = async () => {
    if (!currentUser) {
      showToast("Error", "Please login to follow", "error");
      return;
    }
    if (updating) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/users/follow/${user._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      setFollowing(data.status === "following");
      setRequestPending(data.status === "requested");
      showToast("Success", data.message || "Your follow preference was updated.", "success");
    } catch (error) {
      showToast("Error", error, "error");
    } finally {
      setUpdating(false);
    }
  };

  return { handleFollowUnfollow, updating, following, requestPending };
};

export default useFollowUnfollow;
