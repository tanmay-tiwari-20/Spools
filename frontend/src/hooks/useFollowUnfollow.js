import { useEffect, useState } from "react";
import useShowToast from "./useShowToast";
import userAtom from "../atoms/userAtom";
import { useRecoilValue } from "recoil";

const getFollowingState = (profile, viewerId) => {
  if (typeof profile?.isFollowing === "boolean") return profile.isFollowing;

  // Older or privacy-filtered profile responses may omit the follower IDs.
  const followers = Array.isArray(profile?.followers) ? profile.followers : [];
  return Boolean(viewerId && followers.some((id) => String(id?._id || id) === String(viewerId)));
};

const useFollowUnfollow = (user) => {
  const currentUser = useRecoilValue(userAtom);
  const [following, setFollowing] = useState(() => getFollowingState(user, currentUser?._id));
  const [requestPending, setRequestPending] = useState(Boolean(user?.followRequestPending));
  const [updating, setUpdating] = useState(false);
  const showToast = useShowToast();

  useEffect(() => {
    setFollowing(getFollowingState(user, currentUser?._id));
    setRequestPending(Boolean(user?.followRequestPending));
  }, [user, currentUser?._id]);

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
