const axios = require("axios");
const readline = require("readline");
const {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
  GetLogEventsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");
require("dotenv").config();

// Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3001";

// Initialize AWS CloudWatch Logs client
const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// List available log groups
async function listLogGroups() {
  try {
    const command = new DescribeLogGroupsCommand({});
    const response = await cloudWatchLogsClient.send(command);
    return response.logGroups || [];
  } catch (error) {
    console.error("Error listing log groups:", error.message);
    return [];
  }
}

// Get logs from a specific log group
async function getLogs(
  logGroupName,
  searchString = "",
  startTime = null,
  endTime = null
) {
  try {
    const params = {
      logGroupName,
      filterPattern: searchString,
      startTime,
      endTime,
      limit: 50,
    };

    const command = new FilterLogEventsCommand(params);
    const response = await cloudWatchLogsClient.send(command);
    return response.events || [];
  } catch (error) {
    console.error(`Error getting logs from ${logGroupName}:`, error.message);
    return [];
  }
}

// Verify AWS connection
async function verifyAWSConnection() {
  try {
    console.log("Verifying AWS CloudWatch connection...");
    const logGroups = await listLogGroups();
    console.log("Successfully connected to AWS CloudWatch!");
    console.log(`Found ${logGroups.length} log groups`);

    if (logGroups.length > 0) {
      console.log("\nAvailable log groups:");
      logGroups.slice(0, 5).forEach((group) => {
        console.log(`- ${group.logGroupName}`);
      });
      if (logGroups.length > 5) {
        console.log(`... and ${logGroups.length - 5} more`);
      }
    }
    return true;
  } catch (error) {
    console.error("Failed to connect to AWS CloudWatch:", error.message);
    if (error.name === "CredentialsProviderError") {
      console.error("Please check your AWS credentials in .env file");
    }
    return false;
  }
}

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Initialize the client
async function initializeClient() {
  try {
    console.log("MCP Client initializing...");

    // Verify AWS connection first
    const awsConnected = await verifyAWSConnection();
    if (!awsConnected) {
      console.error(
        "AWS connection failed. Please check your credentials and try again."
      );
      process.exit(1);
    }

    // Fetch available tools from MCP server
    const response = await axios.get(`${MCP_SERVER_URL}/tools`);
    const tools = response.data;

    console.log(`\nClient initialized with ${tools.length} tools available.`);
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
    console.log(
      "\nI can help you with calculations and AWS CloudWatch logs. For example:"
    );
    console.log("Calculations:");
    console.log('- "Add 5 and 3"');
    console.log('- "What is 10 plus 20?"');
    console.log('- "Calculate 7.5 + 2.25"');
    console.log('- "Multiply 4 by 6"');
    console.log('- "What is 8 times 3?"');
    console.log("\nCloudWatch Logs:");
    console.log('- "List all log groups"');
    console.log('- "Search logs in /aws/lambda/my-function for error"');
    console.log('- "Find errors in /aws/ec2/my-instance logs"');
    console.log('- "Show logs from /aws/cloudfront/my-distribution"');
    console.log('- "Get recent logs from /aws/lambda/my-function"');
    console.log('\nType "exit" or "quit" to end the conversation.');
    return;
  }

  // Handle CloudWatch specific commands
  if (message.toLowerCase().startsWith("list all log groups")) {
    const logGroups = await listLogGroups();
    console.log("\nAvailable log groups:");
    logGroups.forEach((group) => {
      console.log(`- ${group.logGroupName}`);
    });
    return;
  }

  try {
    const response = await axios.post(`${MCP_SERVER_URL}/agent`, { message });
    const { explanation, result, toolUsed } = response.data;

    console.log("\nExplanation:", explanation);
    console.log("Tool used:", toolUsed);

    if (toolUsed === "scan_logs") {
      console.log("\nLog Events:");
      if (result.events && result.events.length > 0) {
        result.events.forEach((event, index) => {
          console.log(
            `\n[${index + 1}] ${new Date(event.timestamp).toISOString()}`
          );
          console.log(event.message);
        });
      } else {
        console.log("No matching log events found.");
      }
    } else {
      console.log("Result:", result);
    }
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
