import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { agentService } from '../services/agentService';
import { modelService } from '../services/modelService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: string;
  toolsUsed?: any[];
  reasoning?: any[];
}

interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
}

interface AgentContextType {
  messages: Message[];
  selectedModel: string;
  models: Model[];
  loading: boolean;
  sendMessage: (content: string) => Promise<void>;
  selectModel: (modelId: string) => void;
  clearChat: () => void;
  refreshModels: () => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

interface AgentProviderProps {
  children: ReactNode;
}

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  const loadModels = async () => {
    try {
      const response = await modelService.getModels();
      setModels(response.models);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedModel) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await agentService.chat({
        message: content,
        provider: selectedModel,
        chatHistory: messages
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        provider: response.provider,
        toolsUsed: response.toolsUsed,
        reasoning: response.reasoning
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process message'}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const selectModel = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const refreshModels = async () => {
    await loadModels();
  };

  const value: AgentContextType = {
    messages,
    selectedModel,
    models,
    loading,
    sendMessage,
    selectModel,
    clearChat,
    refreshModels
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};


