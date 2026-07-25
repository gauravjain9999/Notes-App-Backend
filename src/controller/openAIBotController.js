const { GoogleGenerativeAI } = require("@google/generative-ai");
const Chat = require("../models/chat.model");
const logger = require("../utils/logger");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
  /**
   * Generates a response based on user notes and user question.
   * @param {string} message - The user's question.
   * @param {string} context - The user's notes.
   * @returns {Promise<string>} The generated response.
   */

  openAIBot: async (req, res) => {
    try {
      const { message } = req.body;
      const userId = req.user?.id;
      logger.info(`Received message: ${message} from user: ${userId}`);

      // Validation
      if (!message?.trim()) {
        return res.status(400).json({
          apiResponseStatus: false,
          apiResponseData: {
            apiResponseMessage: "Message is required",
          },
        });
      }

      // Find old chat
      let chat = await Chat.findOne({ userId });

      // Create if not exists
      if (!chat) {
        chat = new Chat({
          userId,
          messages: [],
        });
      }

      // Create history from OLD messages only
      const history = chat.messages.map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [
          {
            // Prevent giant context pollution
            text:
              item.content.length > 4000
                ? item.content.substring(0, 4000)
                : item.content,
          },
        ],
      }));

      // Gemini Model
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",

        systemInstruction: `
        You are a helpful AI assistant for a notes application.

        Rules:
        - Answer only what user asks
        - Keep responses concise and relevant
        - Do not continue previous topics automatically
        - If unclear, ask for clarification
      `,
      });

      // Start session
      const chatSession = model.startChat({
        history,
      });

      // Send current message ONLY ONCE
      const result = await chatSession.sendMessage(message);

      // AI response
      const reply = result.response.text();

      // Save user message
      chat.messages.push({
        role: "user",
        content: message,
        createdAt: new Date(),
      });

      // Save assistant message
      chat.messages.push({
        role: "assistant",
        content: reply,
        createdAt: new Date(),
      });

      // Optional: keep max 100 messages
      if (chat.messages.length > 100) {
        chat.messages = chat.messages.slice(-100);
      }

      // Save DB
      await chat.save();

      // Return response
      return res.status(200).json({
        apiResponseData: {
          success: true,
          answer: reply,
        },
        apiResponseStatus: true,
      });
    } catch (error) {
      logger.error("openAIBot error", error);

      return res.status(500).json({
        apiResponseData: {
          apiResponseMessage: "AI generation failed",
        },
        apiResponseStatus: false,
      });
    }
  },

  getChatHistory: async (req, res) => {
    try {
      const userId = req.user?.id;
      const chat = await Chat.findOne({ userId });
      if (!chat) {
        return res.status(200).json({
          apiResponseStatus: true,
          apiResponseData: {
            chats: [],
          },
        });
      }
      return res.status(200).json({
        apiResponseStatus: true,
        apiResponseData: {
          chats: chat.messages,
        },
      });
    } catch (error) {
      logger.error("Get ChatHistory error", error);
      return res.status(500).json({
        apiResponseStatus: false,
        apiResponseData: {
          apiResponseMessage: "Failed to load chats",
        },
      });
    }
  },
};
