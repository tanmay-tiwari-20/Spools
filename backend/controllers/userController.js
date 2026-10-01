import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { deliverUserNotification } from "../utils/webPush.js";
import { canViewPrivateProfile } from "../utils/profilePrivacy.js";

const getUserProfile = async (req, res) => {
  // We will fetch user profile either with username or userId
  // query is either username or userId
  const { query } = req.params;

  try {
    let user;

    // query is userId
    if (mongoose.Types.ObjectId.isValid(query)) {
      user = await User.findOne({ _id: query })
        .select("-password")
        .select("-updatedAt");
    } else {
      // query is username
      user = await User.findOne({ username: query })
        .select("-password")
        .select("-updatedAt");
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    const viewerId = req.user?._id;
    const isOwner = String(user._id) === String(viewerId);
    const isFollowing = Boolean(viewerId && user.followers.some((followerId) => String(followerId) === String(viewerId)));
    const followRequestPending = Boolean(viewerId && user.followRequests.some((requestId) => String(requestId) === String(viewerId)));
    const profile = user.toObject();
    profile.followersCount = user.followers.length;
    profile.followingCount = user.following.length;
    profile.isFollowing = isFollowing;
    profile.followRequestPending = followRequestPending;
    profile.canViewContent = canViewPrivateProfile(user, viewerId);
    if (isOwner) profile.pendingFollowRequestsCount = user.followRequests.length;
    delete profile.followers;
    delete profile.following;
    delete profile.followRequests;
    delete profile.savedPosts;
    delete profile.notificationPreferences;
    delete profile.email;

    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in getUserProfile: ", err.message);
  }
};

const searchUser = async (req, res) => {
  const { query } = req.params;
  try {
    // Search users by matching the query against username or name, case-insensitively
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    })
      .select("name username profilePic bio isPrivate")
      .limit(20); // Limit to 20 results for performance

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in searchUser: ", error.message);
  }
};

const signupUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });
    await newUser.save();

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);

      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        bio: newUser.bio,
        profilePic: newUser.profilePic,
        followers: newUser.followers,
        following: newUser.following,
        isPrivate: newUser.isPrivate,
        savedPosts: newUser.savedPosts || [],
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in signupUser: ", err.message);
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || "",
    );

    if (!user || !isPasswordCorrect)
      return res.status(400).json({ error: "Invalid username or password" });

    if (user.isFrozen) {
      user.isFrozen = false;
      await user.save();
    }

    generateTokenAndSetCookie(user._id, res);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
      followers: user.followers,
      following: user.following,
      isPrivate: user.isPrivate,
      savedPosts: user.savedPosts || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in loginUser: ", error.message);
  }
};

const logoutUser = (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 1,
      httpOnly: true,
      sameSite: "strict",
    });
    res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error("Error in logoutUser: ", err.message);
  }
};

const followUnFollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString())
      return res
        .status(400)
        .json({ error: "You cannot follow/unfollow yourself" });

    if (!userToModify || !currentUser)
      return res.status(400).json({ error: "User not found" });

    const isFollowing = currentUser.following.some((followedId) => String(followedId) === String(id));
    const isRequestPending = userToModify.followRequests.some((requestId) => String(requestId) === String(req.user._id));

    if (isFollowing) {
      // Unfollow user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      return res.status(200).json({ status: "none", message: "User unfollowed successfully" });
    }

    if (isRequestPending) {
      await User.findByIdAndUpdate(id, { $pull: { followRequests: req.user._id } });
      return res.status(200).json({ status: "none", message: "Follow request cancelled" });
    }

    if (userToModify.isPrivate) {
      await User.findByIdAndUpdate(id, { $addToSet: { followRequests: req.user._id } });
      void deliverUserNotification(userToModify._id, {
        type: "follow",
        title: "Follow request",
        body: `@${currentUser.username} requested to follow you.`,
        url: `/${userToModify.username}`,
        tag: `follow-request-${currentUser._id}`,
      });
      return res.status(200).json({ status: "requested", message: "Follow request sent" });
    } else {
      // Follow user
      await User.findByIdAndUpdate(id, { $addToSet: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: id } });
      void deliverUserNotification(userToModify._id, {
        type: "follow",
        title: "New follower",
        body: `@${currentUser.username} started following you.`,
        url: `/${userToModify.username}`,
        tag: `follow-${currentUser._id}`,
      });
      return res.status(200).json({ status: "following", message: "User followed successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in followUnFollowUser: ", err.message);
  }
};

const updatePrivacy = async (req, res) => {
  try {
    if (typeof req.body.isPrivate !== "boolean") return res.status(400).json({ error: "Choose whether your profile is private." });
    const update = { $set: { isPrivate: req.body.isPrivate } };
    if (!req.body.isPrivate) update.$set.followRequests = [];
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("isPrivate followRequests");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ isPrivate: user.isPrivate, pendingFollowRequestsCount: user.followRequests.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getRelationshipList = async (req, res) => {
  try {
    const profile = await User.findById(req.params.id).select("isPrivate followers following");
    if (!profile) return res.status(404).json({ error: "User not found" });
    if (!canViewPrivateProfile(profile, req.user?._id)) {
      return res.status(403).json({ error: "Follow this private profile to see its people list." });
    }

    const relationIds = profile[req.params.list] || [];
    const people = await User.find({ _id: { $in: relationIds }, isFrozen: { $ne: true } })
      .select("name username profilePic")
      .lean();
    const byId = new Map(people.map((person) => [String(person._id), person]));
    return res.status(200).json(relationIds.map((personId) => byId.get(String(personId))).filter(Boolean));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getFollowRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("followRequests", "name username profilePic isFrozen").select("followRequests");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(user.followRequests.filter((person) => person && !person.isFrozen));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const resolveFollowRequest = async (req, res) => {
  try {
    const { requesterId } = req.params;
    const { approve } = req.body;
    if (typeof approve !== "boolean") return res.status(400).json({ error: "Choose whether to approve this request." });
    const owner = await User.findById(req.user._id);
    const requester = await User.findById(requesterId).select("_id");
    if (!owner || !requester) return res.status(404).json({ error: "User not found" });
    const hasRequest = owner.followRequests.some((id) => String(id) === String(requesterId));
    if (!hasRequest) return res.status(404).json({ error: "Follow request not found" });

    owner.followRequests.pull(requester._id);
    if (approve) owner.followers.addToSet(requester._id);
    await owner.save();
    if (approve) await User.findByIdAndUpdate(requester._id, { $addToSet: { following: owner._id } });
    return res.status(200).json({ status: approve ? "following" : "declined", pendingFollowRequestsCount: owner.followRequests.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  const { name, email, username, password, bio } = req.body;
  let { profilePic } = req.body;

  const userId = req.user._id;
  try {
    let user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "User not found" });

    if (req.params.id !== userId.toString())
      return res
        .status(400)
        .json({ error: "You cannot update other user's profile" });

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
    }

    if (profilePic) {
      if (user.profilePic) {
        await cloudinary.uploader.destroy(
          user.profilePic.split("/").pop().split(".")[0],
        );
      }

      const uploadedResponse = await cloudinary.uploader.upload(profilePic);
      profilePic = uploadedResponse.secure_url;
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;
    user.profilePic = profilePic || user.profilePic;
    user.bio = bio || user.bio;

    user = await user.save();

    // Find all posts that this user replied and update username and userProfilePic fields
    await Post.updateMany(
      { "replies.userId": userId },
      {
        $set: {
          "replies.$[reply].username": user.username,
          "replies.$[reply].userProfilePic": user.profilePic,
        },
      },
      { arrayFilters: [{ "reply.userId": userId }] },
    );

    // password should be null in response
    user.password = null;

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in updateUser: ", err.message);
  }
};

const getSuggestedUsers = async (req, res) => {
  try {
    // exclude the current user from suggested users array and exclude users that current user is already following
    const userId = req.user._id;

    const usersFollowedByYou = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);
    const followingStrings = (usersFollowedByYou?.following || []).map((id) =>
      id.toString()
    );

    const filteredUsers = users.filter(
      (user) => !followingStrings.includes(user._id.toString()),
    );
    const suggestedUsers = filteredUsers.slice(0, 4).map((user) => {
      return {
        _id: user._id,
        name: user.name,
        username: user.username,
        profilePic: user.profilePic,
        bio: user.bio,
        isPrivate: user.isPrivate,
        isFollowing: false,
        followRequestPending: (user.followRequests || []).some((id) => String(id) === String(userId)),
        followersCount: (user.followers || []).length,
        followingCount: (user.following || []).length,
      };
    });

    res.status(200).json(suggestedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const freezeAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    user.isFrozen = true;
    await user.save();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error("Error in getMe: ", error.message);
  }
};

export {
  signupUser,
  loginUser,
  logoutUser,
  followUnFollowUser,
  updateUser,
  getUserProfile,
  searchUser,
  getSuggestedUsers,
  freezeAccount,
  getMe,
  updatePrivacy,
  getRelationshipList,
  getFollowRequests,
  resolveFollowRequest,
};
