import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

// Create an instance with proper initialization using the v0.51.0 SDK
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
}

### Examples

**Example 1: "divide 5 by 5"**

{
  "tool": "divide",
  "parameters": {
    "num1": 5,
    "num2": 5
  },
  "explanation": "I'll divide 5 (dividend) by 5 (divisor)"
}

**Example 2: "what is 5 plus 3"**

{
  "tool": "add",
  "parameters": {
    "num1": 5,
    "num2": 3
  },
  "explanation": "I'll add 5 and 3 together"
}

**Example 3: "subtract 4 from 1"**

{
  "tool": "subtract",
  "parameters": {
    "num1": 1,
    "num2": 4
  },
  "explanation": "I'll subtract 4 from 1"
}

Follow all instructions carefully and ensure that your response adheres to the JSON format specified above without any additional text.`;

async function processUserMessage(message) {
  try {
    console.log("Processing user message:", message);

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
    });

    // Parse the response to get the tool and parameters
    console.log("llm response", response);
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

      // Additional validation for division
      if (
        parsedResponse.tool === "divide" &&
        parsedResponse.parameters.num2 === 0
      ) {
        throw new Error("Division by zero is not allowed");
      }

      // Execute the tool using the calculator API
      const calculatorApiUrl =
        process.env.CALCULATOR_API_URL || "http://localhost:3000";
      const toolResponse = await axios.post(
        `${calculatorApiUrl}/${parsedResponse.tool}`,
        parsedResponse.parameters
      );

      console.log("tool response", parsedResponse.tool, toolResponse);

      // Return both the tool execution result and the original response
      return {
        ...parsedResponse,
        result: toolResponse.data,
      };
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

// Current models as of May 2025
const CURRENT_MODELS = {
  SONNET: "claude-3-7-sonnet-20250219",
  HAIKU: "claude-3-5-haiku-20240307",
  OPUS: "claude-3-opus-20240229",
};

// Function to debug the SDK initialization
function debugSdk() {
  try {
    console.log("SDK Version:", require("@anthropic-ai/sdk").version);
    console.log("Anthropic Client:", !!anthropic);
    console.log("Messages property exists:", !!anthropic.messages);
    if (anthropic.messages) {
      console.log(
        "Create method exists:",
        typeof anthropic.messages.create === "function"
      );
    }
    console.log("Available models:", CURRENT_MODELS);
    return true;
  } catch (error) {
    console.error("Debug error:", error);
    return false;
  }
}

export { processUserMessage, debugSdk, CURRENT_MODELS };
