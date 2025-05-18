const axios = require("axios");
const readline = require("readline");

// Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3001";

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Initialize the client
async function initializeClient() {
  try {
    console.log("MCP Client initializing...");

    // Fetch available tools from MCP server
    const response = await axios.get(`${MCP_SERVER_URL}/tools`);
    const tools = response.data;

    console.log(`Client initialized with ${tools.length} tools available.`);
    console.log("Available tools:");
    tools.forEach((tool) => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    startConversation();
  } catch (error) {
    console.error("Failed to initialize client:", error.message);
    process.exit(1);
  }
}

// Process user input
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

  try {
    const response = await axios.post(`${MCP_SERVER_URL}/agent`, { message });
    const { explanation, result, toolUsed } = response.data;

    console.log("\nExplanation:", explanation);
    console.log("Tool used:", toolUsed);
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error.response?.data?.error || error.message);
  }
}

// Start the conversation loop
function startConversation() {
  console.log("\n------------------------------------------");
  console.log(
    'MCP Client is ready! Type "help" for assistance or "exit" to quit.'
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

// Start the client
initializeClient().catch((error) => {
  console.error("Client initialization failed:", error);
});
