import User from "../models/userModel.js";

export const canViewPrivateProfile = (profile, viewerId) => {
  if (!profile?.isPrivate) return true;
  if (!viewerId) return false;
  if (String(profile._id) === String(viewerId)) return true;
  return (profile.followers || []).some((id) => String(id) === String(viewerId));
};

export const canViewPost = async (post, viewerId) => {
  if (!post) return false;
  const author = post.postedBy?.isPrivate !== undefined
    ? post.postedBy
    : await User.findById(post.postedBy?._id || post.postedBy).select("isPrivate followers");
  return canViewPrivateProfile(author, viewerId);
};

export const removePrivateFields = (post) => {
  const result = post?.toObject ? post.toObject() : { ...post };
  if (result?.postedBy && typeof result.postedBy === "object") {
    delete result.postedBy.followers;
    delete result.postedBy.following;
    delete result.postedBy.followRequests;
    delete result.postedBy.password;
  }
  return result;
};
