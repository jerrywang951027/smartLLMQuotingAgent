import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAgent } from '../contexts/AgentContext';
import ChatInterface from './ChatInterface';
import ModelSelector from './ModelSelector';
import MCPServerStatus from './MCPServerStatus';
import { LogOut, Settings, Bot, Server } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedModel, models } = useAgent();
  const [activeTab, setActiveTab] = useState<'chat' | 'servers'>('chat');

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">MCP Agent</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium text-gray-900">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Selector */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">AI Model</h3>
              <ModelSelector />
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span>Chat Interface</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('servers')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'servers'
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4" />
                    <span>MCP Servers</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Current Model Info */}
            {selectedModel && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Model</h3>
                <div className="space-y-2">
                  {models.map(model => 
                    model.id === selectedModel ? (
                      <div key={model.id} className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                        <div className="font-medium text-primary-900">{model.name}</div>
                        <div className="text-sm text-primary-700">{model.provider}</div>
                        <div className="text-xs text-primary-600 mt-1">{model.description}</div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'chat' ? (
              <ChatInterface />
            ) : (
              <MCPServerStatus />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


