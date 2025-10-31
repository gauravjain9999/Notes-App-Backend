const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
  /**
   * Generates a response based on user notes and user question.
   * @param {string} message - The user's question.
   * @param {string} context - The user's notes.
   * @returns {Promise<string>} The generated response.
   */
  openAIBot: async (req, res) => {
    const { message, context } = req.body;

    const possibleModels = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-pro",
  // … others from model list
];

for (const name of possibleModels) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent([
        `Here are user notes: ${context}`,
        `User question: ${message}`
      ]);
      const reply = result.response.text();
      return reply;
    } catch (err) {
      console.warn(`Model ${name} failed:`, err.message);
    }
  }
  throw new Error("No valid model found");
  },
};



// module.exports ={
//   openAIBot: async (req, res) => {
//   const { message } = req.body;

//   try {
//     const response = await axios.post(
//       "https://api.openai.com/v1/chat/completions",
//       {
//         model: "gpt-3.5-turbo", // or gpt-4
//         messages: [{ role: "user", content: message }],
//       },
//       {
//         headers: {
//           "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     const reply = response.data.choices[0].message.content;
//     res.json({ reply });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: "Something went wrong." });
//   }
//  }
// }