const multi = {
  id: "msg_01UPXQmU7cSDfqaaKeyfFhLc",
  type: "message",
  role: "assistant",
  model: "claude-3-7-sonnet-20250219",
  content: [
    {
      type: "text",
      text: 'I need to break down this calculation into steps following BODMAS rules.\n\nFirst, I\'ll add 4 and 4, then from that result, I\'ll subtract 3.\n\nStep 1:\n\n```json\n{\n  "tool": "add",\n  "parameters": {\n    "num1": 4,\n    "num2": 4\n  },\n  "explanation": "Adding 4 and 4 to get the first result"\n}\n```\n\nAfter getting the result from the addition (which would be 8), I would then:\n\nStep 2:\n\n```json\n{\n  "tool": "subtract",\n  "parameters": {\n    "num1": 8,\n    "num2": 3\n  },\n  "explanation": "Subtracting 3 from the previous result (8)"\n}\n```',
    },
  ],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: {
    input_tokens: 417,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    output_tokens: 197,
  },
};

const x3 = {
  id: "msg_01CoTAFvYm7vf8jEmBuPXP5v",
  type: "message",
  role: "assistant",
  model: "claude-3-7-sonnet-20250219",
  content: [
    {
      type: "text",
      text: '{\n  "tool": "add",\n  "parameters": {\n    "num1": 4,\n    "num2": 4\n  },\n  "explanation": "Adding 4 and 4 together"\n}',
    },
  ],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: {
    input_tokens: 411,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    output_tokens: 56,
  },
};
