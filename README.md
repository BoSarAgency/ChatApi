# ChatAPI

A lightweight Node.js API built with HyperExpress that provides chat completions using OpenAI's GPT models. Messages are persisted in SQLite with thread-based conversation history.

## Features

- 🚀 **Fast & Lightweight**: Built with HyperExpress for high performance
- 💬 **Chat Completions**: Integrates with OpenAI's GPT models
- 🗄️ **Persistent Storage**: SQLite database for message history
- 🧵 **Thread Support**: Conversation context maintained per thread
- 🔒 **Error Handling**: Comprehensive error handling and validation
- 🌐 **CORS Enabled**: Ready for frontend integration

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ChatApi
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

4. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:3000`

## API Documentation

### Health Check

**GET** `/`

Returns server status and available endpoints.

**Response:**
```json
{
  "message": "ChatAPI is running!",
  "version": "1.0.0",
  "endpoints": {
    "messages": "POST /messages - Send a message and get AI response"
  }
}
```

### Send Message

**POST** `/messages`

Send a message and receive an AI-generated response.

**Request Body:**
```json
{
  "threadId": "string",
  "content": "string"
}
```

**Parameters:**
- `threadId` (required): Unique identifier for the conversation thread
- `content` (required): The message content to send

**Response:**
```json
{
  "content": "AI-generated response"
}
```

**Error Responses:**

- `400 Bad Request`: Missing or invalid parameters
- `401 Unauthorized`: Invalid OpenAI API key
- `402 Payment Required`: OpenAI API quota exceeded
- `500 Internal Server Error`: Server error

### Example Usage

```bash
# Send a message
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -d '{
    "threadId": "conversation-1",
    "content": "Hello, how are you?"
  }'
```

```javascript
// JavaScript example
const response = await fetch('http://localhost:3000/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    threadId: 'conversation-1',
    content: 'Hello, how are you?'
  })
});

const data = await response.json();
console.log(data.content);
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### OpenAI Model Configuration

The API uses `gpt-3.5-turbo` by default. You can modify the model and parameters in `index.js`:

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo', // Change model here
  messages: openaiMessages,
  max_tokens: 1000,       // Adjust response length
  temperature: 0.7,       // Adjust creativity (0-2)
});
```

## Database Schema

The SQLite database contains a single `messages` table:

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
ChatApi/
├── index.js          # Main server file
├── database.js       # Database connection and operations
├── package.json      # Project dependencies and scripts
├── .env             # Environment variables (not in git)
├── .gitignore       # Git ignore rules
├── messages.db      # SQLite database (created automatically)
└── README.md        # This file
```

## Development

### Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server

### Adding Features

The codebase is structured for easy extension:

1. **Database operations**: Add methods to `database.js`
2. **API endpoints**: Add routes to `index.js`
3. **Middleware**: Add custom middleware in `index.js`

## Error Handling

The API includes comprehensive error handling:

- Input validation for required fields
- Type checking for parameters
- OpenAI API error handling
- Database error handling
- Graceful shutdown handling

## Security Considerations

- API keys are stored in environment variables
- Input validation prevents basic injection attacks
- CORS is enabled for cross-origin requests
- Database uses parameterized queries

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please create an issue in the repository.
