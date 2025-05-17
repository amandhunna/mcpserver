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

// Execute a tool through the MCP server
async function executeTool(toolId, params) {
  try {
    console.log("tool id", toolId);
    console.log("params", params);
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

  // If no specific intent is detected, pass to the generic agent endpoint
  try {
    const final = await axios.post(`${MCP_SERVER_URL}/agent`, { message });
    const { response, tool, parameters, explanation } = final.data;
    if (tool) {
      const result = await executeTool(tool, parameters);
      console.log(result);
    }
    console.log(response);
    console.log(tool);
    console.log(parameters);
    console.log(explanation);
  } catch (error) {
    console.log("Sorry, I had trouble processing your request.");
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
