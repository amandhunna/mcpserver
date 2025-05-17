// llm-agent/agent.js
const axios = require("axios");
const readline = require("readline");

// Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3001";
let tools = [];

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Initialize the agent
async function initializeAgent() {
  try {
    console.log("LLM Agent initializing...");

    // Fetch available tools from MCP server
    const response = await axios.get(`${MCP_SERVER_URL}/tools`);
    tools = response.data;

    console.log(`Agent initialized with ${tools.length} tools available.`);
    console.log("Available tools:");
    tools.forEach((tool) => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    startConversation();
  } catch (error) {
    console.error("Failed to initialize agent:", error.message);
    process.exit(1);
  }
}

// Simple NLP to detect math intent and extract numbers
function parseMathRequest(message) {
  // Check if the message contains keywords related to addition or multiplication
  const hasAdditionIntent = /add|sum|plus|\+/i.test(message);
  const hasMultiplicationIntent =
    /multiply|multiplication|product|times|\*/i.test(message);

  if (!hasAdditionIntent && !hasMultiplicationIntent) return null;

  // Extract numbers from the message
  const numbers = message.match(/-?\d+(\.\d+)?/g);

  if (!numbers || numbers.length < 2) return null;

  return {
    num1: parseFloat(numbers[0]),
    num2: parseFloat(numbers[1]),
    operation: hasMultiplicationIntent ? "multiply" : "add",
  };
}

// Execute a tool through the MCP server
async function executeTool(toolId, params) {
  try {
    const response = await axios.post(
      `${MCP_SERVER_URL}/execute/${toolId}`,
      params
    );
    return response.data;
  } catch (error) {
    console.error(`Error executing tool ${toolId}:`, error.message);
    if (error.response && error.response.data) {
      return { error: error.response.data };
    }
    return { error: "Failed to execute tool" };
  }
}

// Process user input and determine actions
async function processMessage(message) {
  // Check for exit command
  if (message.toLowerCase() === "exit" || message.toLowerCase() === "quit") {
    console.log("Goodbye!");
    rl.close();
    process.exit(0);
  }

  // Check for help command
  if (message.toLowerCase() === "help") {
    console.log("\nI can help you with calculations. For example:");
    console.log('- "Add 5 and 3"');
    console.log('- "What is 10 plus 20?"');
    console.log('- "Calculate 7.5 + 2.25"');
    console.log('- "Multiply 4 by 6"');
    console.log('- "What is 8 times 3?"');
    console.log('\nType "exit" or "quit" to end the conversation.');
    return;
  }

  // Try to parse as a math request
  const mathParams = parseMathRequest(message);

  if (mathParams) {
    const operation = mathParams.operation;
    console.log(
      `I'll calculate ${mathParams.num1} ${
        operation === "multiply" ? "×" : "+"
      } ${mathParams.num2} for you...`
    );

    const result = await executeTool(operation, mathParams);

    if (result.error) {
      console.log(`Sorry, there was an error: ${result.error}`);
    } else {
      console.log(
        `The result of ${result.num1} ${operation === "multiply" ? "×" : "+"} ${
          result.num2
        } is ${result.result}`
      );
    }
  } else {
    // If no specific intent is detected, pass to the generic agent endpoint
    try {
      const response = await axios.post(`${MCP_SERVER_URL}/agent`, { message });
      console.log(response.data.response);
    } catch (error) {
      console.log("Sorry, I had trouble processing your request.");
    }
  }
}

// Start the conversation loop
function startConversation() {
  console.log("\n------------------------------------------");
  console.log(
    'LLM Agent is ready! Type "help" for assistance or "exit" to quit.'
  );
  console.log("------------------------------------------\n");

  promptUser();
}

// Prompt for user input
function promptUser() {
  rl.question("You: ", async (message) => {
    await processMessage(message);
    promptUser(); // Continue the conversation
  });
}

// Start the agent
initializeAgent().catch((error) => {
  console.error("Agent initialization failed:", error);
});
