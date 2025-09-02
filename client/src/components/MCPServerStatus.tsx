import React, { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw, Tool } from 'lucide-react';
import axios from 'axios';

interface MCPServer {
  id: string;
  name: string;
  status: string;
  protocol: string;
  host?: string;
  port?: number;
  command?: string;
  args?: string[];
}

interface MCPTool {
  id: string;
  name: string;
  description: string;
  serverId: string;
  parameters: any;
}

const MCPServerStatus: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [serversResponse, toolsResponse] = await Promise.all([
        axios.get('/api/mcp/servers'),
        axios.get('/api/mcp/tools')
      ]);
      
      setServers(serversResponse.data.servers);
      setTools(toolsResponse.data.tools);
    } catch (error) {
      console.error('Failed to load MCP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading MCP server status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">MCP Server Status</h2>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Servers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(servers).map((server) => (
          <div key={server.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">{server.name}</h3>
              </div>
              {getStatusIcon(server.status)}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Protocol:</span> {server.protocol.toUpperCase()}
              </div>
              {server.protocol === 'ws' ? (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Host:</span> {server.host}:{server.port}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Command:</span> {server.command} {server.args?.join(' ')}
                </div>
              )}
              <div className="text-sm text-gray-600">
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs border ${getStatusColor(server.status)}`}>
                  {server.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tools Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Available Tools</h3>
          <div className="text-sm text-gray-500">
            {tools.length} tool{tools.length !== 1 ? 's' : ''} available
          </div>
        </div>

        {tools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Tool className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No tools available from MCP servers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tools.map((tool) => (
              <div key={tool.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Tool className="h-4 w-4 text-gray-500" />
                      <h4 className="font-medium text-gray-900">{tool.name}</h4>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {tool.serverId}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
                    {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Parameters:</span>
                        <pre className="mt-1 bg-white p-2 rounded border text-xs overflow-x-auto">
                          {JSON.stringify(tool.parameters, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection Info */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Wifi className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">MCP Protocol</h3>
            <p className="text-sm text-blue-700">
              Model Context Protocol (MCP) servers provide tools and capabilities that the AI agent can use.
              The agent automatically selects and invokes appropriate tools based on your requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPServerStatus;
