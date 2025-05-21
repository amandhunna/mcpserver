const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const { Anthropic } = require("@anthropic-ai/sdk");
const {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
  DescribeLogGroupsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize AWS CloudWatch Logs client
const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
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
  {
    id: "scan_logs",
    name: "cloudwatch_logs",
    description: "Scans AWS CloudWatch logs for specific string patterns",
    parameters: {
      type: "object",
      properties: {
        logGroupName: {
          type: "string",
          description: "Name of the CloudWatch log group",
        },
        searchString: {
          type: "string",
          description: "String pattern to search for in logs",
        },
        startTime: {
          type: "number",
          description: "Start time in milliseconds since epoch",
        },
        endTime: {
          type: "number",
          description: "End time in milliseconds since epoch",
        },
      },
      required: ["logGroupName", "searchString"],
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
6. **CloudWatch Logs (scan_logs)**: Searches AWS CloudWatch logs for specific string patterns.

When a user asks for a calculation:
- Determine the correct tool to use.
- Extract the necessary parameters following the exact names:
  - For subtraction: **num1** is the number being subtracted from, **num2** is the number being subtracted.
  - For division: **num1** is the dividend (number being divided), **num2** is the divisor (number to divide by).
  - For power: **num1** is the base, **num2** is the exponent.
  - For CloudWatch logs: **logGroupName** is the name of the log group, **searchString** is the pattern to search for.

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
  "tool": "add" | "subtract" | "multiply" | "divide" | "power" | "scan_logs",
  "parameters": {
    "num1": number,
    "num2": number
  } | {
    "logGroupName": string,
    "searchString": string,
    "startTime"?: number,
    "endTime"?: number
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
    console.log("response", JSON.stringify(response));
    const content = response.content[0].text;
    try {
      // First try to find JSON in markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[1].trim());
        return validateAndReturnResponse(parsedResponse);
      }

      // If no markdown code block, try to find any JSON object in the text
      const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        const parsedResponse = JSON.parse(jsonObjectMatch[0].trim());
        return validateAndReturnResponse(parsedResponse);
      }

      throw new Error("No valid JSON found in response");
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

// Helper function to validate and return the response
function validateAndReturnResponse(parsedResponse) {
  // Validate the response structure
  if (
    !parsedResponse.tool ||
    !parsedResponse.parameters ||
    !parsedResponse.explanation
  ) {
    throw new Error("Invalid response structure");
  }

  // Validate parameters based on tool type
  if (parsedResponse.tool === "scan_logs") {
    if (
      typeof parsedResponse.parameters.logGroupName !== "string" ||
      typeof parsedResponse.parameters.searchString !== "string"
    ) {
      throw new Error("Invalid parameter types for scan_logs");
    }
  } else {
    // Validate calculator parameters
    if (
      typeof parsedResponse.parameters.num1 !== "number" ||
      typeof parsedResponse.parameters.num2 !== "number"
    ) {
      throw new Error("Invalid parameter types for calculator operations");
    }
  }

  return parsedResponse;
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

    if (toolId === "scan_logs") {
      const command = new FilterLogEventsCommand({
        logGroupName: params.logGroupName,
        filterPattern: params.searchString,
        startTime: params.startTime,
        endTime: params.endTime,
      });

      const response = await cloudWatchLogsClient.send(command);
      return res.json({
        events: response.events,
        nextToken: response.nextToken,
      });
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

    let result;
    if (tool === "scan_logs") {
      try {
        // Special case: Listing all log groups
        if (
          parameters.logGroupName === "/" ||
          parameters.logGroupName === "*"
        ) {
          const allLogGroups = await cloudWatchLogsClient.send(
            new DescribeLogGroupsCommand({})
          );

          return res.json({
            explanation: "Listing all available AWS CloudWatch log groups",
            result: {
              logGroups:
                allLogGroups.logGroups?.map((group) => ({
                  name: group.logGroupName,
                  lastEventTime: group.lastEventTimestamp,
                  creationTime: group.creationTime,
                  retentionInDays: group.retentionInDays,
                })) || [],
            },
            toolUsed: "list_log_groups",
          });
        }

        // Normal case: Searching within a specific log group
        const logGroupName = parameters.logGroupName.startsWith("/aws/lambda/")
          ? parameters.logGroupName
          : `/aws/lambda/${parameters.logGroupName}`;

        // First verify if the log group exists
        const logGroups = await cloudWatchLogsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        if (!logGroups.logGroups || logGroups.logGroups.length === 0) {
          // Get all available log groups for better error message
          const allLogGroups = await cloudWatchLogsClient.send(
            new DescribeLogGroupsCommand({})
          );

          return res.status(404).json({
            error: `Log group '${logGroupName}' not found.`,
            availableLogGroups:
              allLogGroups.logGroups?.map((group) => group.logGroupName) || [],
            message: "Please use one of the available log groups listed above.",
          });
        }

        const command = new FilterLogEventsCommand({
          logGroupName: logGroupName,
          filterPattern: parameters.searchString || "",
          startTime: parameters.startTime,
          endTime: parameters.endTime,
        });
        const response = await cloudWatchLogsClient.send(command);
        result = {
          events: response.events || [],
          nextToken: response.nextToken,
          logGroupName: logGroupName,
        };
      } catch (error) {
        console.error("CloudWatch error:", error);
        if (error.name === "ResourceNotFoundException") {
          // Get all available log groups for better error message
          const allLogGroups = await cloudWatchLogsClient.send(
            new DescribeLogGroupsCommand({})
          );

          return res.status(404).json({
            error: `Log group '${parameters.logGroupName}' not found.`,
            availableLogGroups:
              allLogGroups.logGroups?.map((group) => group.logGroupName) || [],
            message: "Please use one of the available log groups listed above.",
          });
        }
        throw error;
      }
    } else {
      const executeResponse = await axios.post(
        `${CALCULATOR_API_URL}/${tool}`,
        parameters
      );
      result = executeResponse.data;
    }

    return res.json({
      explanation,
      result,
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
