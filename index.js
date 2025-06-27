require("dotenv").config();
const HyperExpress = require("hyper-express");
const OpenAI = require("openai");
const Database = require("./database");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize database
const database = new Database();

// Create HyperExpress server
const app = new HyperExpress.Server();

// CORS middleware
app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (request.method === "OPTIONS") {
    response.status(200).send("");
    return;
  }

  next();
});

// Health check endpoint
app.get("/", (request, response) => {
  response.json({
    message: "ChatAPI is running!",
    version: "1.0.0",
    endpoints: {
      messages: "POST /messages - Send a message and get AI response",
    },
  });
});

// Messages endpoint
app.post("/messages", async (request, response) => {
  try {
    // Parse JSON body using HyperExpress built-in method
    const body = await request.json();
    const { threadId, content } = body;
    console.log("Received message:", JSON.stringify(body));

    // Validate input
    if (!threadId || !content) {
      return response.status(400).json({
        error: "Missing required fields: threadId and content are required",
      });
    }

    if (typeof threadId !== "string" || typeof content !== "string") {
      return response.status(400).json({
        error: "Invalid field types: threadId and content must be strings",
      });
    }

    if (content.trim().length === 0) {
      return response.status(400).json({
        error: "Content cannot be empty",
      });
    }

    // Save user message to database
    await database.saveMessage(threadId, "user", content);

    // Get conversation history for context
    const messages = await database.getMessagesByThread(threadId);

    // Prepare messages for OpenAI API (convert to OpenAI format)
    const openaiMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add system prompt to provide context and instructions
    const systemPrompt = {
      role: "system",
      content:
        "You are a helpful AI assistant. Provide clear, concise, and accurate responses. Be friendly and professional in your interactions.",
    };

    // Insert system prompt at the beginning of the conversation
    openaiMessages.unshift(systemPrompt);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: openaiMessages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0].message.content;

    // Save assistant response to database
    await database.saveMessage(threadId, "assistant", assistantResponse);

    // Return response
    console.log("Sent response:", assistantResponse);
    response.json({ content: assistantResponse });
  } catch (error) {
    console.error("Error processing message:", error);

    // Handle specific OpenAI errors
    if (error.code === "insufficient_quota") {
      return response.status(402).json({
        error: "OpenAI API quota exceeded",
      });
    }

    if (error.code === "invalid_api_key") {
      return response.status(401).json({
        error: "Invalid OpenAI API key",
      });
    }

    // Generic error response
    response.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
});

// Error handling middleware
app.set_error_handler((request, response, error) => {
  console.error("Unhandled error:", error);
  response.status(500).json({
    error: "Internal server error",
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await database.initialize();

    const PORT = process.env.PORT || 3000;

    // Try to start the server and handle the promise properly
    try {
      await app.listen(PORT);
      console.log(`🚀 ChatAPI server is running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/`);
      console.log(
        `💬 Messages endpoint: POST http://localhost:${PORT}/messages`
      );
    } catch (listenError) {
      const errorMessage =
        listenError?.message || listenError?.toString() || "Unknown error";

      if (
        errorMessage.includes("busy port") ||
        errorMessage.includes("EADDRINUSE") ||
        errorMessage.includes("address already in use")
      ) {
        console.error(
          `❌ Port ${PORT} is already in use. Please try a different port.`
        );
        console.log(
          `💡 Try setting PORT environment variable: PORT=3001 npm start`
        );
      } else {
        console.error(
          `❌ Failed to start server on port ${PORT}:`,
          errorMessage
        );
      }
      throw listenError;
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  await database.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down server...");
  await database.close();
  process.exit(0);
});

// Start the server
startServer();
