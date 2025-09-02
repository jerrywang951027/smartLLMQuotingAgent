import React from 'react';
import { useAgent } from '../contexts/AgentContext';
import { Bot, Zap, Sparkles } from 'lucide-react';

const ModelSelector: React.FC = () => {
  const { models, selectedModel, selectModel } = useAgent();

  const getModelIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'anthropic':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'google':
        return <Bot className="h-4 w-4 text-green-500" />;
      default:
        return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  const getModelColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'border-blue-200 hover:border-blue-300';
      case 'anthropic':
        return 'border-purple-200 hover:border-purple-300';
      case 'google':
        return 'border-green-200 hover:border-green-300';
      default:
        return 'border-gray-200 hover:border-gray-300';
    }
  };

  if (models.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {models.map((model) => (
        <button
          key={model.id}
          onClick={() => selectModel(model.id)}
          className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-200 ${
            selectedModel === model.id
              ? 'bg-primary-50 border-primary-300 shadow-sm'
              : `bg-white ${getModelColor(model.provider)} hover:shadow-sm`
          }`}
        >
          <div className="flex items-center space-x-3">
            {getModelIcon(model.provider)}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {model.name}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {model.provider}
              </div>
            </div>
            {selectedModel === model.id && (
              <div className="h-3 w-3 bg-primary-600 rounded-full"></div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-600 line-clamp-2">
            {model.description}
          </div>
        </button>
      ))}
    </div>
  );
};

export default ModelSelector;


