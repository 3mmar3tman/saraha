const Message = require("../models/message.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;

    // 1. Validate content
    if (!content || !content.trim()) {
      throw new AppError("Message is required", 400);
    }

    // 2. Check receiver
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      throw new AppError("User not found", 404);
    }

    // 3. Create message
    const message = await Message.create({
      sender: req.user?.id || null,
      receiver: receiverId,
      content,
    });

    // 4. Response
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

const getMyMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      receiver: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name email");

    res.status(200).json({
      success: true,
      results: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage,getMyMessages };