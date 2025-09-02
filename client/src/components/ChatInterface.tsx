import React, { useState, useRef, useEffect } from 'react';
import { useAgent } from '../contexts/AgentContext';
import { Send, Trash2, Bot, User, Tool, Brain } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ChatInterface: React.FC = () => {
  const { messages, loading, sendMessage, clearChat, selectedModel } = useAgent();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || loading) return;
    
    if (!selectedModel) {
      toast.error('Please select a model first');
      return;
    }

    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: any) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`flex space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-primary-600 text-white' 
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
            <div className={`inline-block p-4 rounded-lg ${
              isUser 
                ? 'bg-primary-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Message Metadata */}
              <div className={`text-xs mt-2 ${
                isUser ? 'text-primary-100' : 'text-gray-500'
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
                <div className="text-xs text-gray-500 mb-1 flex items-center">
                  <Tool className="h-3 w-3 mr-1" />
                  Tools used: {message.toolsUsed.length}
                </div>
                <div className="space-y-1">
                  {message.toolsUsed.map((tool: any, index: number) => (
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

            {/* Reasoning Steps */}
            {message.reasoning && message.reasoning.length > 0 && (
              <div className="mt-2 text-left">
                <div className="text-xs text-gray-500 mb-1 flex items-center">
                  <Brain className="h-3 w-3 mr-1" />
                  Reasoning steps: {message.reasoning.length}
                </div>
                <div className="space-y-1">
                  {message.reasoning.map((step: any, index: number) => (
                    <div key={index} className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                      <div className="font-medium text-blue-700">Step {index + 1}</div>
                      <div className="text-blue-600 text-xs mt-1">
                        {step.action?.tool && `Tool: ${step.action.tool}`}
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
    <div className="card h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Chat with AI Agent</h2>
        <button
          onClick={clearChat}
          className="btn-secondary flex items-center space-x-2"
        >
          <Trash2 className="h-4 w-4" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-2">
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
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message here..."
          className="input-field flex-1"
          disabled={loading || !selectedModel}
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim() || !selectedModel}
          className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span>AI is thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;


