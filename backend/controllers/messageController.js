import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import { getRecipientSocketId, io } from "../socket/socket.js";
import { v2 as cloudinary } from "cloudinary";
import { deliverUserNotification } from "../utils/webPush.js";

const uploadAudioBuffer = (buffer) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    { resource_type: "video", folder: "spools/audio-messages" },
    (error, result) => error ? reject(error) : resolve(result)
  );
  uploadStream.end(buffer);
});

async function sendMessage(req, res) {
  try {
    const { recipientId, message, replyTo } = req.body;
    let { img } = req.body;
    const audioFile = req.file;
    const audioDuration = Number(req.body.audioDuration) || 0;
    let waveformValues = req.body.audioWaveform;
    if (typeof waveformValues === "string") {
      try {
        waveformValues = JSON.parse(waveformValues);
      } catch {
        waveformValues = [];
      }
    }
    const audioWaveform = Array.isArray(waveformValues)
      ? waveformValues.slice(0, 48).map((value) => Math.min(1, Math.max(0, Number(value) || 0)))
      : [];
    const senderId = req.user._id;

    if (!recipientId || (!String(message || "").trim() && !img && !audioFile)) {
      return res.status(400).json({ error: "A recipient and message, image, or voice message are required." });
    }
    if (img && audioFile) {
      return res.status(400).json({ error: "Send an image or a voice message at a time." });
    }
    if (audioFile && !audioFile.mimetype.startsWith("audio/")) {
      return res.status(400).json({ error: "The voice message format is invalid." });
    }
    if (audioFile && (audioDuration < 1 || audioDuration > 180)) {
      return res.status(400).json({ error: "Voice messages must be between 1 second and 3 minutes." });
    }
    if (String(recipientId) === String(senderId)) {
      return res.status(400).json({ error: "You cannot message yourself." });
    }
    const recipient = await User.findById(recipientId).select("_id isFrozen");
    if (!recipient || recipient.isFrozen) {
      return res.status(404).json({ error: "This account is unavailable." });
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
    let audio = "";
    if (audioFile) {
      const uploadedResponse = await uploadAudioBuffer(audioFile.buffer);
      audio = uploadedResponse.secure_url;
    }

    const messageType = audio ? "audio" : img ? "image" : "text";
    const lastMessageText = String(message || "").trim() || (audio ? "Voice message" : img ? "Photo" : "");

    const newMessage = new Message({
      conversationId: conversation._id,
      sender: senderId,
      text: message,
      img: img || "",
      audio: audio || "",
      audioDuration: audio ? audioDuration : 0,
      audioWaveform: audio ? audioWaveform : [],
      seen: false,
      replyTo: replyToId,
    });

    // Save the new message and update the conversation's last message
    await Promise.all([
      newMessage.save(),
      conversation.updateOne({
        lastMessage: {
          text: lastMessageText,
          sender: senderId,
          type: messageType,
          seen: false, // Set the last message as unseen until marked
        },
      }),
    ]);
    await newMessage.populate("replyTo", "sender text img audio");

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
      body: message?.trim() || (audio ? "Sent you a voice message." : img ? "Sent you an image." : "Sent you a message."),
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

async function forwardMessage(req, res) {
  try {
    const { recipientId } = req.body;
    if (!recipientId || String(recipientId) === String(req.user._id)) {
      return res.status(400).json({ error: "Choose another person to forward this message to." });
    }

    const [original, recipient] = await Promise.all([
      Message.findById(req.params.messageId),
      User.findById(recipientId).select("_id username profilePic isFrozen"),
    ]);
    if (!original) return res.status(404).json({ error: "Message not found." });
    if (!recipient || recipient.isFrozen) return res.status(404).json({ error: "That account is unavailable." });

    const sourceConversation = await Conversation.findOne({
      _id: original.conversationId,
      participants: req.user._id,
    }).select("_id");
    if (!sourceConversation) return res.status(403).json({ error: "You cannot forward this message." });

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipient._id] },
    });
    if (!conversation) {
      conversation = new Conversation({ participants: [req.user._id, recipient._id] });
      await conversation.save();
    }

    const forwardedMessage = new Message({
      conversationId: conversation._id,
      sender: req.user._id,
      text: original.text || "",
      img: original.img || "",
      audio: original.audio || "",
      audioDuration: original.audioDuration || 0,
      audioWaveform: original.audioWaveform || [],
      forwarded: true,
      seen: false,
    });
    const messageType = original.audio ? "audio" : original.img ? "image" : "text";
    const previewText = original.text?.trim() || (original.audio ? "Voice message" : original.img ? "Photo" : "");

    await Promise.all([
      forwardedMessage.save(),
      conversation.updateOne({
        lastMessage: {
          text: previewText,
          sender: req.user._id,
          type: messageType,
          seen: false,
        },
      }),
    ]);

    const messagePayload = {
      ...forwardedMessage.toObject(),
      senderProfile: {
        _id: String(req.user._id),
        username: req.user.username,
        profilePic: req.user.profilePic,
      },
    };
    const recipientSocketId = getRecipientSocketId(String(recipient._id));
    if (recipientSocketId) io.to(recipientSocketId).emit("newMessage", messagePayload);

    void deliverUserNotification(recipient._id, {
      type: "message",
      title: `New message from @${req.user.username}`,
      body: `Forwarded a ${original.audio ? "voice message" : original.img ? "photo" : "message"}.`,
      senderId: String(req.user._id),
      url: "/chat",
      tag: `message-${conversation._id}`,
    });

    return res.status(201).json({ message: messagePayload });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
      .select("text img audio sender seen createdAt");
    const lastMessage = latestMessage
      ? {
          text: latestMessage.text || (latestMessage.audio ? "Voice message" : latestMessage.img ? "Photo" : ""),
          sender: latestMessage.sender,
          type: latestMessage.audio ? "audio" : latestMessage.img ? "image" : "text",
          seen: latestMessage.seen,
        }
      : { text: "", sender: null, type: "text", seen: true };
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
    const otherUser = await User.findById(otherUserId).select("_id isFrozen");
    if (!otherUser || otherUser.isFrozen) {
      return res.status(404).json({ error: "This conversation is unavailable." });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).populate("replyTo", "sender text img audio").sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getConversations(req, res) {
  const userId = req.user._id;
  try {
    const allConversations = await Conversation.find({
      participants: userId,
    }).populate({
      path: "participants",
      select: "username profilePic isFrozen",
    });
    const conversations = allConversations.filter((conversation) =>
      conversation.participants.every((participant) => participant && !participant.isFrozen)
    );

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

export { sendMessage, forwardMessage, deleteMessage, getMessages, getConversations };
