// calculator-api/app.js
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

// Addition endpoint
app.post("/add", (req, res) => {
  try {
    const { num1, num2 } = req.body;
    const validation = validateNumbers(num1, num2);
    if (validation) return res.status(400).json(validation);

    const result = num1 + num2;
    console.log(`Calculated: ${num1} + ${num2} = ${result}`);
    return res.json({ operation: "addition", num1, num2, result });
  } catch (error) {
    console.error("Error in addition endpoint:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Subtraction endpoint
app.post("/subtract", (req, res) => {
  try {
    const { num1, num2 } = req.body;
    const validation = validateNumbers(num1, num2);
    if (validation) return res.status(400).json(validation);

    const result = num1 - num2;
    console.log(`Calculated: ${num1} - ${num2} = ${result}`);
    return res.json({ operation: "subtraction", num1, num2, result });
  } catch (error) {
    console.error("Error in subtraction endpoint:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Multiplication endpoint
app.post("/multiply", (req, res) => {
  try {
    const { num1, num2 } = req.body;
    const validation = validateNumbers(num1, num2);
    if (validation) return res.status(400).json(validation);

    const result = num1 * num2;
    console.log(`Calculated: ${num1} * ${num2} = ${result}`);
    return res.json({ operation: "multiplication", num1, num2, result });
  } catch (error) {
    console.error("Error in multiplication endpoint:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Division endpoint
app.post("/divide", (req, res) => {
  try {
    const { num1, num2 } = req.body;
    const validation = validateNumbers(num1, num2);
    if (validation) return res.status(400).json(validation);

    if (num2 === 0) {
      return res.status(400).json({ error: "Division by zero is not allowed" });
    }

    const result = num1 / num2;
    console.log(`Calculated: ${num1} / ${num2} = ${result}`);

    // Ensure we're sending a proper response
    return res.json({
      operation: "division",
      num1,
      num2,
      result: Number(result.toFixed(10)), // Round to 10 decimal places to avoid floating point issues
    });
  } catch (error) {
    console.error("Error in division endpoint:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Power/Exponent endpoint
app.post("/power", (req, res) => {
  try {
    const { num1, num2 } = req.body;
    const validation = validateNumbers(num1, num2);
    if (validation) return res.status(400).json(validation);

    const result = Math.pow(num1, num2);
    console.log(`Calculated: ${num1} ^ ${num2} = ${result}`);
    return res.json({ operation: "power", num1, num2, result });
  } catch (error) {
    console.error("Error in power endpoint:", error);
    return res.status(500).json({ error: "Server error" });
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

module.exports = app; // For testing
