import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";

// Function to send a message
async function sendMessage(req, res) {
  try {
    const { recipientId, message } = req.body;
    const senderId = req.user._id;

    // Find or create a conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
        lastMessage: {
          text: message,
          sender: senderId,
        },
      });
      await conversation.save();
    } else {
      // If the conversation exists, update the lastMessage
      conversation.lastMessage = {
        text: message,
        sender: senderId,
      };
      await conversation.save();
    }

    // Create a new message
    const newMessage = new Message({
      conversationId: conversation._id, // Ensure this matches the correct field name
      sender: senderId,
      text: message,
    });

    await newMessage.save(); // Save the new message

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Function to get messages in a conversation
async function getMessages(req, res) {
  const { otherUserId } = req.params;
  const userId = req.user._id;

  try {
    // Find the conversation between the two users
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Find messages for the conversation
    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .populate("sender", "username profilePic"); // Optionally populate sender details

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Function to get all conversations for a user
async function getConversations(req, res) {
  const userId = req.user._id;

  try {
    const conversations = await Conversation.find({
      participants: userId,
    }).populate({
      path: "participants",
      select: "username profilePic",
    });

    // Filter out the current user from participants
    conversations.forEach((conversation) => {
      conversation.participants = conversation.participants.filter(
        (participant) => participant._id.toString() !== userId.toString()
      );
    });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export { sendMessage, getMessages, getConversations };
