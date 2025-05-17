// mcp-server/server.js
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

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
        num1: {
          type: "number",
          description: "First number to add",
        },
        num2: {
          type: "number",
          description: "Second number to add",
        },
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
];

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
    switch (toolId) {
      case "add":
        const { num1, num2 } = params;

        // Validate parameters
        if (typeof num1 !== "number" || typeof num2 !== "number") {
          return res.status(400).json({
            error: "Invalid parameters. Both num1 and num2 must be numbers.",
            received: { num1: typeof num1, num2: typeof num2 },
          });
        }

        // Call the calculator API
        const response = await axios.post(`${CALCULATOR_API_URL}/add`, {
          num1,
          num2,
        });
        return res.json(response.data);

      default:
        return res.status(404).json({ error: `Tool '${toolId}' not found` });
    }
  } catch (error) {
    console.error(`Error executing tool ${toolId}:`, error.message);

    if (error.response) {
      // Forward the API error response
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

  // Here we would typically process the message and determine which tools to use
  // For this demo, we'll just return information about available tools

  return res.json({
    response:
      "I'm the MCP server. I can help you with calculations. To use the addition tool, you need to provide two numbers.",
    availableTools: tools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
    })),
  });
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

module.exports = app; // For testing
