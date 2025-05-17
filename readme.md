Setting Up the MCP Environment
This guide explains how to set up and run the complete MCP (Model-Consumer-Provider) environment with three components:

Calculator Express API
MCP Server
LLM Agent
Prerequisites
Node.js (v14 or later)
npm or yarn
Project Structure
mcp-environment/
│
├── calculator-api/
│ ├── app.js
│ └── package.json
│
├── mcp-server/
│ ├── server.js
│ └── package.json
│
└── llm-agent/
├── agent.js
└── package.json
Installation

1. Set up Calculator API
   bash
   cd calculator-api
   npm install
2. Set up MCP Server
   bash
   cd mcp-server
   npm install
3. Set up LLM Agent
   bash
   cd llm-agent
   npm install
   Running the Environment
   Open three terminal windows, one for each component:

Terminal 1: Start Calculator API
bash
cd calculator-api
npm start

# Should see: Calculator API running on port 3000

Terminal 2: Start MCP Server
bash
cd mcp-server
npm start

# Should see: MCP Server running on port 3001

Terminal 3: Start LLM Agent
bash
cd llm-agent
npm start

# Should see: LLM Agent initializing...

Testing the System
Once all three components are running, you can interact with the LLM Agent in Terminal 3:

Ask it to help you with calculations:
"Add 5 and 7"
"What is 10 plus 20?"
"Calculate 15.5 + 4.5"
Type "help" to see available commands
Type "exit" or "quit" to end the conversation
How It Works
Calculator API - A simple Express server that provides a mathematical addition service
MCP Server - Acts as a tool provider, exposing the Calculator API functionality as a tool
LLM Agent - Simulates an LLM that can understand user requests and use tools via the MCP Server
System Flow
User sends a message to the LLM Agent
Agent parses the message to understand intent
If addition is requested, Agent calls the MCP Server's execute endpoint
MCP Server calls the Calculator API to perform the calculation
Result flows back through the chain to the user
Environment Variables
You can customize the connections between components using these environment variables:

For the MCP Server:
PORT: The port for the MCP Server (default: 3001)
CALCULATOR_API_URL: URL of the Calculator API (default: http://localhost:3000)
For the LLM Agent:
MCP_SERVER_URL: URL of the MCP Server (default: http://localhost:3001)
Extending the System
You can extend this system by:

Adding more operations to the Calculator API (subtract, multiply, divide)
Registering those operations as tools in the MCP Server
Enhancing the LLM Agent to detect and use those additional tools
