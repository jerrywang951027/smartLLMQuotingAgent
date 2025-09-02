import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Trash2, Copy, Activity, X, ChevronRight, ChevronLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('google'); // Default model - Gemini
  const [showLogWindow, setShowLogWindow] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
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

  const addLogEntry = (type, data) => {
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

    // Log user message
    addLogEntry('user_message', {
      content: userMessage.content,
      provider: selectedModel
    });

    try {
      // Log LLM request
      addLogEntry('llm_request', {
        provider: selectedModel,
        message: userMessage.content,
        chatHistory: messages.length
      });

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
      
      // Log LLM response
      addLogEntry('llm_response', {
        provider: result.provider,
        response: result.response,
        success: result.success,
        toolsUsed: result.toolsUsed?.length || 0
      });

      // Log tool executions if any
      if (result.toolsUsed && result.toolsUsed.length > 0) {
        result.toolsUsed.forEach((tool, index) => {
          addLogEntry('tool_execution', {
            tool: tool.tool,
            input: tool.input,
            output: tool.output,
            index: index + 1,
            total: result.toolsUsed.length
          });
        });
      }

      // Log LLM processing after tools if applicable
      if (result.reasoning && result.reasoning.some(r => r.includes('processed results with LLM'))) {
        addLogEntry('llm_after_tools', {
          provider: result.provider,
          finalResponse: result.response,
          reasoning: result.reasoning
        });
      }
      
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
      <div key={log.id} className="border-b border-gray-100 p-3 hover:bg-gray-50">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getLogIcon(log.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                {getLogTypeLabel(log.type)}
              </h4>
              <span className="text-xs text-gray-500">
                {formatTimestamp(log.timestamp)}
              </span>
            </div>
            
            <div className="mt-1 text-xs text-gray-600">
              {log.type === 'user_message' && (
                <div>
                  <div className="font-medium">Message:</div>
                  <div className="mt-1 p-2 bg-blue-50 rounded text-gray-800">
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
                  <div className="mt-1 p-2 bg-green-50 rounded text-gray-800">
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
                  <div className="mt-1 p-2 bg-green-50 rounded text-gray-800 max-h-20 overflow-y-auto">
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
                    <div className="p-1 bg-orange-50 rounded text-gray-800">
                      {JSON.stringify(log.data.input)}
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-medium">Output:</div>
                    <div className="p-1 bg-orange-50 rounded text-gray-800 max-h-16 overflow-y-auto">
                      {typeof log.data.output === 'string' ? log.data.output : JSON.stringify(log.data.output)}
                    </div>
                  </div>
                </div>
              )}
              
              {log.type === 'llm_after_tools' && (
                <div>
                  <div className="font-medium">LLM Processing Tool Results:</div>
                  <div className="mt-1">Provider: {log.data.provider}</div>
                  <div className="mt-1 p-2 bg-purple-50 rounded text-gray-800 max-h-20 overflow-y-auto">
                    {log.data.finalResponse}
                  </div>
                </div>
              )}
              
              {log.type === 'error' && (
                <div>
                  <div className="font-medium">Error:</div>
                  <div className="mt-1 p-2 bg-red-50 rounded text-red-800">
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
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              {/* Copy Icon */}
              <button
                onClick={() => copyMessage(message.content)}
                className={`absolute top-2 right-2 p-1 rounded-md transition-colors ${
                  isUser 
                    ? 'hover:bg-blue-500 text-blue-100 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
                title="Copy message"
              >
                <Copy className="h-3 w-3" />
              </button>
              
              <div className="whitespace-pre-wrap pr-8">{message.content}</div>
              
              {/* Message Metadata */}
              <div className={`text-xs mt-2 ${
                isUser ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTimestamp(message.timestamp)}
                {message.provider && (
                  <span className="ml-2">via {message.provider}</span>
                )}
              </div>
            </div>

            {/* Tools Used */}
            {message.toolsUsed && message.toolsUsed.length > 0 && (
              <div className="mt-2 text-left">
                <div className="text-xs text-gray-500 mb-1">Tools used: {message.toolsUsed.length}</div>
                <div className="space-y-1">
                  {message.toolsUsed.map((tool, index) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded border">
                      <div className="font-medium text-gray-700">{tool.tool}</div>
                      <div className="text-gray-600 text-xs mt-1">
                        Input: {JSON.stringify(tool.input)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">MCP Agent Chat</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Model Selector */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors flex items-center space-x-2"
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-gray-500">
                    Ask me anything! I can help you with various tasks using my available tools.
                  </p>
                </div>
              ) : (
                messages.map(renderMessage)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Agent Log Window */}
        {showLogWindow && (
          <div className="w-1/3 border-l border-gray-200 bg-white">
            <div className="h-full flex flex-col">
              {/* Log Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Agent Log</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {agentLogs.length} entries
                    </span>
                    <button
                      onClick={clearLogs}
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      title="Clear logs"
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Log Entries */}
              <div className="flex-1 overflow-y-auto">
                {agentLogs.length === 0 ? (
                  <div className="p-6 text-center">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
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
