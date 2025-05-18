const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper function to validate numbers
function validateNumbers(num1, num2) {
  if (typeof num1 !== "number" || typeof num2 !== "number") {
    return {
      error: "Both inputs must be numbers",
      received: { num1: typeof num1, num2: typeof num2 },
    };
  }
  return null;
}

// Calculator operations
const operations = {
  add: (num1, num2) => num1 + num2,
  subtract: (num1, num2) => num1 - num2,
  multiply: (num1, num2) => num1 * num2,
  divide: (num1, num2) => {
    if (num2 === 0) throw new Error("Division by zero is not allowed");
    return Number((num1 / num2).toFixed(10));
  },
  power: (num1, num2) => Math.pow(num1, num2),
};

// Generic operation handler
app.post("/:operation", (req, res) => {
  try {
    const { operation } = req.params;
    const { num1, num2 } = req.body;

    // Validate operation exists
    if (!operations[operation]) {
      return res
        .status(404)
        .json({ error: `Operation '${operation}' not found` });
    }

    // Validate numbers
    const validation = validateNumbers(num1, num2);
    if (validation) return res.status(400).json(validation);

    // Perform calculation
    const result = operations[operation](num1, num2);
    console.log(`Calculated: ${num1} ${operation} ${num2} = ${result}`);

    return res.json({
      operation,
      num1,
      num2,
      result,
    });
  } catch (error) {
    console.error(`Error in ${req.params.operation} endpoint:`, error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Calculator API running on port ${PORT}`);
});

module.exports = app;
