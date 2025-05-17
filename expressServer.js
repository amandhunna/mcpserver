// calculator-api/app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Addition endpoint
app.post("/add", (req, res) => {
  try {
    const { num1, num2 } = req.body;

    // Validate input
    if (typeof num1 !== "number" || typeof num2 !== "number") {
      return res.status(400).json({
        error: "Both inputs must be numbers",
        received: { num1: typeof num1, num2: typeof num2 },
      });
    }

    const result = num1 + num2;

    console.log(`Calculated: ${num1} + ${num2} = ${result}`);

    return res.json({
      operation: "addition",
      num1,
      num2,
      result,
    });
  } catch (error) {
    console.error("Error in addition endpoint:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/multiply", (req, res) => {
  try {
    const { num1, num2 } = req.body;

    // Validate input
    if (typeof num1 !== "number" || typeof num2 !== "number") {
      return res.status(400).json({
        error: "Both inputs must be numbers",
        received: { num1: typeof num1, num2: typeof num2 },
      });
    }

    const result = num1 * num2;

    console.log(`Calculated: ${num1} * ${num2} = ${result}`);

    return res.json({
      operation: "multiplication",
      num1,
      num2,
      result,
    });
  } catch (error) {
    console.error("Error in multiplication endpoint:", error);
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
