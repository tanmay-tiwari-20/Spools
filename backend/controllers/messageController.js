import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getRecipientSocketId, io } from "../socket/socket.js";
import { v2 as cloudinary } from "cloudinary";
import { deliverUserNotification } from "../utils/webPush.js";

async function sendMessage(req, res) {
  try {
    const { recipientId, message, replyTo } = req.body;
    let { img } = req.body;
    const senderId = req.user._id;

    if (!recipientId || (!String(message || "").trim() && !img)) {
      return res.status(400).json({ error: "A recipient and message or image are required." });
    }
    if (String(recipientId) === String(senderId)) {
      return res.status(400).json({ error: "You cannot message yourself." });
    }

    // Find or create the conversation between the sender and recipient
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
        lastMessage: {
          text: message,
          sender: senderId,
          seen: false, // Initially set to false
        },
      });
      await conversation.save();
    }

    // Get the recipient's socket ID before creating the new message
    const recipientSocketId = getRecipientSocketId(recipientId);

    // Create the new message with the `seen` status
    let replyToId = null;
    if (replyTo) {
      const referencedMessage = await Message.findOne({
        _id: replyTo,
        conversationId: conversation._id,
      }).select("_id");
      if (!referencedMessage) {
        return res.status(400).json({ error: "The message you’re replying to could not be found." });
      }
      replyToId = referencedMessage._id;
    }

    // Upload media after validating the reply target.
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newMessage = new Message({
      conversationId: conversation._id,
      sender: senderId,
      text: message,
      img: img || "",
      seen: false,
      replyTo: replyToId,
    });

    // Save the new message and update the conversation's last message
    await Promise.all([
      newMessage.save(),
      conversation.updateOne({
        lastMessage: {
          text: message,
          sender: senderId,
          seen: false, // Set the last message as unseen until marked
        },
      }),
    ]);
    await newMessage.populate("replyTo", "sender text img");

    // Emit the new message to the recipient if they are online
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("newMessage", {
        ...newMessage.toObject(),
        senderProfile: {
          _id: String(req.user._id),
          username: req.user.username,
          profilePic: req.user.profilePic,
        },
      });
    }

    void deliverUserNotification(recipientId, {
      type: "message",
      title: `New message from @${req.user.username}`,
      body: message?.trim() || "Sent you an image.",
      senderId: String(senderId),
      url: "/chat",
      tag: `message-${conversation._id}`,
    });

    // Send the response back to the client
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteMessage(req, res) {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: "Message not found." });
    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ error: "You can only delete your own messages." });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      participants: req.user._id,
    });
    if (!conversation) return res.status(404).json({ error: "Conversation not found." });

    const conversationId = String(conversation._id);
    const messageId = String(message._id);
    await message.deleteOne();

    const latestMessage = await Message.findOne({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .select("text sender seen createdAt");
    const lastMessage = latestMessage
      ? { text: latestMessage.text, sender: latestMessage.sender, seen: latestMessage.seen }
      : { text: "", sender: null, seen: true };
    const updatedAt = latestMessage?.createdAt || conversation.createdAt;

    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { lastMessage, updatedAt } },
      { timestamps: false }
    );

    const recipientId = conversation.participants.find(
      (participant) => String(participant) !== String(req.user._id)
    );
    const recipientSocketId = recipientId && getRecipientSocketId(String(recipientId));
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("messageDeleted", {
        conversationId,
        messageId,
        lastMessage,
        updatedAt,
      });
    }

    return res.status(200).json({ conversationId, messageId, lastMessage, updatedAt });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getMessages(req, res) {
  const { otherUserId } = req.params;
  const userId = req.user._id;
  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).populate("replyTo", "sender text img").sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getConversations(req, res) {
  const userId = req.user._id;
  try {
    const conversations = await Conversation.find({
      participants: userId,
    }).populate({
      path: "participants",
      select: "username profilePic",
    });

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversations.map((conversation) => conversation._id) },
          sender: { $ne: userId },
          seen: false,
        },
      },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]);
    const unreadCountByConversation = new Map(
      unreadCounts.map(({ _id, count }) => [String(_id), count])
    );

    // remove the current user from the participants array
    const response = conversations.map((conversation) => {
      const data = conversation.toObject();
      data.participants = data.participants.filter(
        (participant) => participant._id.toString() !== userId.toString()
      );
      data.unreadCount = unreadCountByConversation.get(String(conversation._id)) || 0;
      return data;
    });
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export { sendMessage, deleteMessage, getMessages, getConversations };
