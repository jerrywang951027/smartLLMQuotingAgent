# Smart LLM Quoting Agent

A full-stack AI agent application that integrates multiple Large Language Models (LLMs) with Model Context Protocol (MCP) servers for intelligent task execution and tool usage.

## 🚀 Features

### Multi-LLM Support
- **Google Gemini 2.0 Flash** (Default)
- **OpenAI GPT-4o Mini**
- **Anthropic Claude**

### Agent Capabilities
- **Intelligent Tool Execution**: Automatically detects and executes tools based on LLM responses
- **Real-time Logging**: Comprehensive agent activity logging with detailed execution traces
- **Weather Integration**: Built-in weather tool using wttr.in API
- **MCP Server Support**: Ready for Model Context Protocol server integration

### Frontend Features
- **Modern React Interface**: Clean, responsive UI built with Tailwind CSS
- **Agent Log Window**: Real-time visibility into LLM requests, responses, and tool executions
- **Model Selection**: Easy switching between different LLM providers
- **Message History**: Persistent chat history with copy functionality

### Backend Features
- **LangChain Integration**: Advanced agent orchestration using LangChain framework
- **Tool Execution Pipeline**: Automatic tool detection, execution, and result processing
- **Error Handling**: Robust error handling and fallback mechanisms
- **RESTful API**: Clean API endpoints for frontend communication

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **LangChain** for AI agent orchestration
- **Google Generative AI** SDK
- **OpenAI** SDK
- **Anthropic** SDK
- **JWT** for authentication
- **Bcrypt** for password hashing

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- API keys for desired LLM providers

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/jerrywang951027/smartLLMQuotingAgent.git
   cd smartLLMQuotingAgent
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   # LLM API Keys
   GOOGLE_API_KEY=your_google_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # Optional: Weather API (currently using free wttr.in)
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Start the application**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually:
   # Backend (port 3000)
   cd server && npm start
   
   # Frontend (port 3001)
   cd client && npm start
   ```

## 🎯 Usage

### Basic Chat Interface
1. Open the application in your browser (http://localhost:3001)
2. Select your preferred LLM model from the dropdown
3. Type your message and press Send
4. The agent will process your request and provide a response

### Agent Log Window
1. Click the "Agent Log" button in the header to toggle the log window
2. View real-time logs of:
   - User messages
   - LLM requests and responses
   - Tool executions
   - Error handling
3. Use the clear button to reset logs

### Available Tools
- **Weather Tool**: Get current weather information for any city
  - Example: "What's the weather in Paris?"
  - Example: "How's the weather in New York today?"

## 🔧 Architecture

### Agent Execution Flow
1. **User Input**: User sends message through frontend
2. **LLM Processing**: Selected LLM processes the request
3. **Tool Detection**: System detects if tools need to be executed
4. **Tool Execution**: Tools are executed with appropriate parameters
5. **Result Processing**: LLM processes tool results and generates final response
6. **Response Delivery**: Natural language response sent to user

### Logging System
The application provides comprehensive logging of:
- **User Messages**: Input from users with provider selection
- **LLM Requests**: Outgoing requests to LLM providers
- **LLM Responses**: Raw responses from LLM providers
- **Tool Executions**: Individual tool calls with input/output
- **LLM After Tools**: Final processing of tool results
- **Errors**: Any errors encountered during execution

## 🚀 Development

### Project Structure
```
smartLLMQuotingAgent/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── contexts/       # React contexts
│   └── package.json
├── server/                 # Node.js backend
│   ├── services/           # Business logic
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   └── package.json
├── .env                    # Environment variables
└── README.md
```

### Adding New Tools
1. Create tool function in `server/services/agentService.js`
2. Add tool to the `createTools()` method
3. Update tool schema and description
4. Test tool execution through the interface

### Adding New LLM Providers
1. Install provider SDK in `server/package.json`
2. Add initialization in `server/services/llmService.js`
3. Add response generation method
4. Update frontend model selector

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LangChain](https://langchain.com/) for AI agent orchestration
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React](https://reactjs.org/) for the frontend framework
- [wttr.in](https://wttr.in/) for weather data

## 📞 Support

If you have any questions or need help, please:
1. Check the [Issues](https://github.com/jerrywang951027/smartLLMQuotingAgent/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your setup and the problem

---

**Built with ❤️ using modern AI technologies**