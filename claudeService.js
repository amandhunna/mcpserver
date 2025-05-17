const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI assistant that helps users perform calculations and other tasks.
You have access to the following tools:
1. Addition: Adds two numbers together
2. Multiplication: Multiplies two numbers together

When a user asks for a calculation, determine which tool to use and extract the necessary parameters.
Respond in JSON format with the following structure:
{
  "tool": "add" or "multiply",
  "parameters": {
    "num1": number,
    "num2": number
  },
  "explanation": "Brief explanation of what you're doing"
}`;

async function processUserMessage(message) {
  try {
    const response = await claude.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    // Parse the response to get the tool and parameters
    const content = response.content[0].text;
    try {
      const parsedResponse = JSON.parse(content);
      return parsedResponse;
    } catch (e) {
      console.error("Error parsing Claude response:", e);
      return {
        error: "Failed to parse Claude response",
        rawResponse: content,
      };
    }
  } catch (error) {
    console.error("Error calling Claude:", error);
    throw error;
  }
}

module.exports = {
  processUserMessage,
};
