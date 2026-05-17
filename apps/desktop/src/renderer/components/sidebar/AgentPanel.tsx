import React, { useState, useRef, useEffect } from 'react';
import { useAiStore } from '../../stores/ai.store.js';
import { SparkleIcon, SendIcon, StopIcon, TrashIcon, SearchIcon } from '../shared/icons.js';

export const AgentPanel: React.FC = () => {
  const {
    chatMessages,
    isLoading,
    error,
    provider,
    model,
    tasks,
    activeTask,
    searchResults,
    sendMessage,
    clearChat,
    searchCodebase,
  } = useAiStore();

  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'search'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    searchCodebase(searchQuery.trim());
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <SparkleIcon className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2 py-1 text-xs rounded ${
              activeTab === 'chat' ? 'bg-zinc-700' : 'hover:bg-zinc-800'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-2 py-1 text-xs rounded ${
              activeTab === 'tasks' ? 'bg-zinc-700' : 'hover:bg-zinc-800'
            }`}
          >
            Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-2 py-1 text-xs rounded ${
              activeTab === 'search' ? 'bg-zinc-700' : 'hover:bg-zinc-800'
            }`}
          >
            Search
          </button>
        </div>
        <button
          onClick={clearChat}
          className="p-1 hover:bg-zinc-800 rounded"
          title="Clear chat"
        >
          <TrashIcon className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {!provider && (
        <div className="px-4 py-2 bg-yellow-900/30 border-b border-yellow-800 text-yellow-200 text-xs">
          No AI provider configured. Go to Settings to set up Ollama, OpenAI, or Anthropic.
        </div>
      )}

      {error && (
        <div className="px-4 py-2 bg-red-900/30 border-b border-red-800 text-red-200 text-xs">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {activeTab === 'chat' && (
          <>
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <SparkleIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Ask me anything about your codebase</p>
                <p className="text-xs mt-1">
                  {provider ? `Connected to ${provider} (${model})` : 'Not connected'}
                </p>
              </div>
            )}

            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.role === 'assistant'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'bg-zinc-700 text-zinc-300'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {message.content}
                  </pre>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-lg px-3 py-2 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center text-zinc-500 text-sm py-8">
                No tasks yet. Use chat to start a task.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-zinc-800 rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{task.role}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        task.status === 'completed'
                          ? 'bg-green-900/50 text-green-300'
                          : task.status === 'running'
                          ? 'bg-blue-900/50 text-blue-300'
                          : task.status === 'failed'
                          ? 'bg-red-900/50 text-red-300'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs mb-2">{task.description}</p>
                  {task.result && (
                    <pre className="bg-zinc-900 rounded p-2 text-xs whitespace-pre-wrap">
                      {task.result}
                    </pre>
                  )}
                  {task.error && (
                    <p className="text-red-400 text-xs">{task.error}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search codebase..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
              >
                <SearchIcon className="w-4 h-4" />
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="bg-zinc-800 rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-purple-400">
                        {result.chunk.metadata.path}
                      </span>
                      <span className="text-xs text-zinc-500">
                        score: {result.score.toFixed(3)}
                      </span>
                    </div>
                    <pre className="bg-zinc-900 rounded p-2 text-xs whitespace-pre-wrap overflow-auto max-h-32">
                      {result.chunk.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'chat' && (
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 border-t border-zinc-800"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your code..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
