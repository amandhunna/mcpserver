const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const { Anthropic } = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configuration
const CALCULATOR_API_URL =
  process.env.CALCULATOR_API_URL || "http://localhost:3000";

// Tool definitions
const tools = [
  {
    id: "add",
    name: "addition",
    description: "Adds two numbers together",
    parameters: {
      type: "object",
      properties: {
        num1: { type: "number", description: "First number to add" },
        num2: { type: "number", description: "Second number to add" },
      },
      required: ["num1", "num2"],
    },
  },
  {
    id: "subtract",
    name: "subtraction",
    description: "Subtracts second number from first number",
    parameters: {
      type: "object",
      properties: {
        num1: { type: "number", description: "Number to subtract from" },
        num2: { type: "number", description: "Number to subtract" },
      },
      required: ["num1", "num2"],
    },
  },
  {
    id: "multiply",
    name: "multiplication",
    description: "Multiplies two numbers together",
    parameters: {
      type: "object",
      properties: {
        num1: { type: "number" },
        num2: { type: "number" },
      },
      required: ["num1", "num2"],
    },
  },
  {
    id: "divide",
    name: "division",
    description: "Divides first number by second number",
    parameters: {
      type: "object",
      properties: {
        num1: { type: "number", description: "Number to divide" },
        num2: { type: "number", description: "Number to divide by" },
      },
      required: ["num1", "num2"],
    },
  },
  {
    id: "power",
    name: "power",
    description: "Raises first number to the power of second number",
    parameters: {
      type: "object",
      properties: {
        num1: { type: "number", description: "Base number" },
        num2: { type: "number", description: "Exponent" },
      },
      required: ["num1", "num2"],
    },
  },
];

// System prompt for Claude
const SYSTEM_PROMPT = `You are an AI assistant that helps users perform calculations and other mathematical tasks by selecting the appropriate tool for the job. You have access to the following tools:

1. **Addition (add)**: Adds two numbers together.
2. **Subtraction (subtract)**: Subtracts the second number from the first number.
3. **Multiplication (multiply)**: Multiplies two numbers together.
4. **Division (divide)**: Divides the first number (dividend) by the second number (divisor).
5. **Power (power)**: Raises the first number (base) to the power of the second number (exponent).

When a user asks for a calculation:
- Determine the correct tool to use.
- Extract the necessary parameters following the exact names:
  - For subtraction: **num1** is the number being subtracted from, **num2** is the number being subtracted.
  - For division: **num1** is the dividend (number being divided), **num2** is the divisor (number to divide by).
  - For power: **num1** is the base, **num2** is the exponent.

For complex expressions, break them into steps by adhering to the BODMAS rules:
1. **Brackets**
2. **Orders (Powers)**
3. **Division**
4. **Multiplication**
5. **Addition**
6. **Subtraction**

### Response Format
Always respond in JSON format with the following structure:

{
  "tool": "add" | "subtract" | "multiply" | "divide" | "power",
  "parameters": {
    "num1": number,
    "num2": number
  },
  "explanation": "Brief explanation of what you're doing"
}`;

// Process user message with Claude
async function processUserMessage(message) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
    });

    const content = response.content[0].text;
    try {
      const parsedResponse = JSON.parse(content);

      // Validate the response structure
      if (
        !parsedResponse.tool ||
        !parsedResponse.parameters ||
        !parsedResponse.explanation
      ) {
        throw new Error("Invalid response structure");
      }

      // Validate parameters
      if (
        typeof parsedResponse.parameters.num1 !== "number" ||
        typeof parsedResponse.parameters.num2 !== "number"
      ) {
        throw new Error("Invalid parameter types");
      }

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

// Endpoint for tool discovery
app.get("/tools", (req, res) => {
  res.json(tools);
});

// Endpoint for tool execution
app.post("/execute/:toolId", async (req, res) => {
  const { toolId } = req.params;
  const params = req.body;

  console.log(`Executing tool: ${toolId} with params:`, params);

  try {
    if (!tools.find((t) => t.id === toolId)) {
      return res.status(404).json({ error: `Tool '${toolId}' not found` });
    }

    const response = await axios.post(
      `${CALCULATOR_API_URL}/${toolId}`,
      params
    );
    return res.json(response.data);
  } catch (error) {
    console.error(`Error executing tool ${toolId}:`, error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// LLM agent interface endpoint
app.post("/agent", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const claudeResponse = await processUserMessage(message);

    if (claudeResponse.error) {
      return res.status(500).json({ error: claudeResponse.error });
    }

    const { tool, parameters, explanation } = claudeResponse;
    const executeResponse = await axios.post(
      `${CALCULATOR_API_URL}/${tool}`,
      parameters
    );

    return res.json({
      explanation,
      result: executeResponse.data,
      toolUsed: tool,
    });
  } catch (error) {
    console.error("Error processing message:", error);
    return res.status(500).json({
      error: "Failed to process message",
      details: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});

module.exports = app;
