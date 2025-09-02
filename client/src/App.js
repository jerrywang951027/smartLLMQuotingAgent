import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Trash2, Copy, Activity, X, ChevronRight, ChevronLeft, Moon, Sun } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('google'); // Default model - Gemini
  const [showLogWindow, setShowLogWindow] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const logEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollLogToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollLogToBottom();
  }, [agentLogs]);

  // WebSocket connection setup
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Listen for agent logs from server
    newSocket.on('agent_log', (logEntry) => {
      console.log('Received log from server:', logEntry);
      setAgentLogs(prev => [...prev, logEntry]);
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      toast.success('Connected to real-time logging');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      toast.error('Disconnected from real-time logging');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const addLogEntry = (type, data) => {
    // This function is now only used for local logs (like errors)
    const logEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      timestamp: new Date().toISOString(),
      data
    };
    setAgentLogs(prev => [...prev, logEntry]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Send message to backend agent
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          provider: selectedModel,
          chatHistory: messages
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date().toISOString(),
          provider: result.provider,
          toolsUsed: result.toolsUsed,
          reasoning: result.reasoning
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || 'Failed to get response from agent');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Log error
      addLogEntry('error', {
        error: error.message,
        provider: selectedModel
      });
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setAgentLogs([]);
  };

  const clearLogs = () => {
    setAgentLogs([]);
  };

  const copyMessage = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Message copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy message:', err);
      toast.error('Failed to copy message');
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'user_message':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'llm_request':
        return <Bot className="h-4 w-4 text-green-600" />;
      case 'llm_response':
        return <Bot className="h-4 w-4 text-green-600" />;
      case 'tool_execution':
        return <Activity className="h-4 w-4 text-orange-600" />;
      case 'llm_after_tools':
        return <Bot className="h-4 w-4 text-purple-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLogTypeLabel = (type) => {
    switch (type) {
      case 'user_message':
        return 'User Message';
      case 'llm_request':
        return 'LLM Request';
      case 'llm_response':
        return 'LLM Response';
      case 'tool_execution':
        return 'Tool Execution';
      case 'llm_after_tools':
        return 'LLM After Tools';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const renderLogEntry = (log) => {
    return (
      <div key={log.id} className={`border-b p-3 ${
        isDarkMode 
          ? 'border-gray-700 hover:bg-gray-700' 
          : 'border-gray-100 hover:bg-gray-50'
      }`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getLogIcon(log.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {getLogTypeLabel(log.type)}
              </h4>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatTimestamp(log.timestamp)}
              </span>
            </div>
            
            <div className={`mt-1 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {log.type === 'user_message' && (
                <div>
                  <div className="font-medium">Message:</div>
                  <div className={`mt-1 p-2 rounded ${
                    isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-gray-800'
                  }`}>
                    {log.data.content}
                  </div>
                  <div className="mt-1">Provider: {log.data.provider}</div>
                </div>
              )}
              
              {log.type === 'llm_request' && (
                <div>
                  <div className="font-medium">Requesting LLM:</div>
                  <div className="mt-1">Provider: {log.data.provider}</div>
                  <div className="mt-1">Chat History: {log.data.chatHistory} messages</div>
                  <div className={`mt-1 p-2 rounded ${
                    isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-50 text-gray-800'
                  }`}>
                    {log.data.message}
                  </div>
                </div>
              )}
              
              {log.type === 'llm_response' && (
                <div>
                  <div className="font-medium">LLM Response:</div>
                  <div className="mt-1">Provider: {log.data.provider}</div>
                  <div className="mt-1">Tools Used: {log.data.toolsUsed}</div>
                  <div className="mt-1">Success: {log.data.success ? 'Yes' : 'No'}</div>
                  <div className={`mt-1 p-2 rounded max-h-20 overflow-y-auto ${
                    isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-50 text-gray-800'
                  }`}>
                    {log.data.response}
                  </div>
                </div>
              )}
              
              {log.type === 'tool_execution' && (
                <div>
                  <div className="font-medium">Tool: {log.data.tool}</div>
                  <div className="mt-1">Execution {log.data.index}/{log.data.total}</div>
                  <div className="mt-1">
                    <div className="text-xs font-medium">Input:</div>
                    <div className={`p-1 rounded ${
                      isDarkMode ? 'bg-orange-900 text-orange-100' : 'bg-orange-50 text-gray-800'
                    }`}>
                      {JSON.stringify(log.data.input)}
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-medium">Output:</div>
                    <div className={`p-1 rounded max-h-16 overflow-y-auto ${
                      isDarkMode ? 'bg-orange-900 text-orange-100' : 'bg-orange-50 text-gray-800'
                    }`}>
                      {typeof log.data.output === 'string' ? log.data.output : JSON.stringify(log.data.output)}
                    </div>
                  </div>
                </div>
              )}
              
              {log.type === 'llm_after_tools' && (
                <div>
                  <div className="font-medium">LLM Processing Tool Results:</div>
                  <div className="mt-1">Provider: {log.data.provider}</div>
                  <div className={`mt-1 p-2 rounded max-h-20 overflow-y-auto ${
                    isDarkMode ? 'bg-purple-900 text-purple-100' : 'bg-purple-50 text-gray-800'
                  }`}>
                    {log.data.finalResponse}
                  </div>
                </div>
              )}
              
              {log.type === 'error' && (
                <div>
                  <div className="font-medium">Error:</div>
                  <div className={`mt-1 p-2 rounded ${
                    isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-800'
                  }`}>
                    {log.data.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMessage = (message) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex space-x-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : isDarkMode
                ? 'bg-gray-600 text-gray-300'
                : 'bg-gray-200 text-gray-600'
          }`}>
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>

          {/* Message Content */}
          <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-4 rounded-lg relative ${
              isUser 
                ? 'bg-blue-600 text-white' 
                : isDarkMode
                  ? 'bg-gray-700 border border-gray-600 text-gray-100'
                  : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              {/* Copy Icon */}
              <button
                onClick={() => copyMessage(message.content)}
                className={`absolute top-2 right-2 p-1 rounded-md transition-colors ${
                  isUser 
                    ? 'hover:bg-blue-500 text-blue-100 hover:text-white' 
                    : isDarkMode
                      ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200'
                      : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
                title="Copy message"
              >
                <Copy className="h-3 w-3" />
              </button>
              
              <div className="whitespace-pre-wrap pr-8">{message.content}</div>
              
              {/* Message Metadata */}
              <div className={`text-xs mt-2 ${
                isUser ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {formatTimestamp(message.timestamp)}
                {message.provider && (
                  <span className="ml-2">via {message.provider}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`shadow-sm border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>MCP Agent Chat</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                  isDarkMode 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span>{isDarkMode ? 'Light' : 'Dark'}</span>
              </button>

              {/* Model Selector */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="google">Google Gemini</option>
                <option value="openai">OpenAI GPT-4</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
              
              {/* Agent Log Toggle */}
              <button
                onClick={() => setShowLogWindow(!showLogWindow)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                  showLogWindow 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>Agent Log</span>
                {showLogWindow ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
              
              <button
                onClick={clearChat}
                className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Chat</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Chat Area */}
        <div className={`${showLogWindow ? 'w-2/3' : 'w-full'} transition-all duration-300 px-4 py-6`}>
          <div className={`rounded-xl shadow-sm border h-full flex flex-col ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Start a conversation
                  </h3>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    Ask me anything! I can help you with various tasks using my available tools.
                  </p>
                </div>
              ) : (
                messages.map(renderMessage)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className={`border-t p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message here..."
                  className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="mt-4 text-center">
              <div className={`inline-flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Agent Log Window */}
        {showLogWindow && (
          <div className={`w-1/3 border-l ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="h-full flex flex-col">
              {/* Log Header */}
              <div className={`border-b p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Agent Log</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {agentLogs.length} entries
                    </span>
                    <button
                      onClick={clearLogs}
                      className={`p-1 rounded-md transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                      title="Clear logs"
                    >
                      <Trash2 className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Log Entries */}
              <div className="flex-1 overflow-y-auto">
                {agentLogs.length === 0 ? (
                  <div className="p-6 text-center">
                    <Activity className={`h-8 w-8 mx-auto mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No agent activity yet. Start a conversation to see logs.
                    </p>
                  </div>
                ) : (
                  agentLogs.map(renderLogEntry)
                )}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
