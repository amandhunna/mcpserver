# MCP Calculator Service

A Model-Context-Protocol (MCP) implementation for a calculator service that uses Claude AI to process natural language requests and perform mathematical calculations.

## Architecture

The service consists of three main components:

1. **Calculator API** (`calculator-api.js`): Handles basic mathematical operations
2. **MCP Server** (`mcp-server.js`): Manages LLM integration and tool orchestration
3. **MCP Client** (`mcp-client.js`): Provides a user interface for interacting with the service

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```
ANTHROPIC_API_KEY=your_api_key_here
PORT=3000
MCP_PORT=3001
```

## Running the Service

You can run all components concurrently:

```bash
npm start
```

Or run them individually:

```bash
# Calculator API
npm run start:calculator

# MCP Server
npm run start:mcp

# MCP Client
npm run start:client
```

## Usage

Once the service is running, you can interact with it through the client interface. Here are some example commands:

- "Add 5 and 3"
- "What is 10 plus 20?"
- "Calculate 7.5 + 2.25"
- "Multiply 4 by 6"
- "What is 8 times 3?"

Type "help" for more examples or "exit" to quit.

## API Endpoints

### Calculator API (Port 3000)

- `POST /:operation` - Perform mathematical operations (add, subtract, multiply, divide, power)
- `GET /health` - Health check endpoint

### MCP Server (Port 3001)

- `GET /tools` - List available tools
- `POST /execute/:toolId` - Execute a specific tool
- `POST /agent` - Process natural language requests
- `GET /health` - Health check endpoint

## Error Handling

The service includes comprehensive error handling for:

- Invalid mathematical operations
- Division by zero
- Invalid parameter types
- LLM response parsing errors
- Network errors

## Dependencies

- @anthropic-ai/sdk: ^0.51.0
- axios: ^1.6.7
- body-parser: ^1.20.2
- cors: ^2.8.5
- dotenv: ^16.4.5
- express: ^4.18.3
- concurrently: ^8.2.2 (dev dependency)
