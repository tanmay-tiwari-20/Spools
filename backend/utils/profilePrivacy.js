import User from "../models/userModel.js";

export const canViewPrivateProfile = (profile, viewerId) => {
  if (!profile || profile.isFrozen) return false;
  if (!profile?.isPrivate) return true;
  if (!viewerId) return false;
  if (String(profile._id) === String(viewerId)) return true;
  return (profile.followers || []).some((id) => String(id) === String(viewerId));
};

export const canViewPost = async (post, viewerId) => {
  if (!post) return false;
  const author = post.postedBy?.isPrivate !== undefined
    ? post.postedBy
    : await User.findById(post.postedBy?._id || post.postedBy).select("isPrivate isFrozen followers");
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

export const removeFrozenReplies = async (posts = []) => {
  const list = (Array.isArray(posts) ? posts : [posts]).filter(Boolean);
  const replyUserIds = [...new Set(list.flatMap((post) =>
    (post.replies || []).map((reply) => String(reply.userId || "")).filter(Boolean)
  ))];
  if (!replyUserIds.length) return list.map((post) => post?.toObject ? post.toObject() : { ...post });

  const frozenUserIds = await User.find({ _id: { $in: replyUserIds }, isFrozen: true }).distinct("_id");
  const frozenUserIdSet = new Set(frozenUserIds.map(String));
  return list.map((post) => {
    const result = post?.toObject ? post.toObject() : { ...post };
    result.replies = (result.replies || []).filter((reply) => !frozenUserIdSet.has(String(reply.userId)));
    return result;
  });
};
