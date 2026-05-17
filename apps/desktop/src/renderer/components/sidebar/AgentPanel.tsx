import React, { useState, useRef, useEffect } from 'react';
import { useAiStore } from '../../stores/ai.store.js';
import { SparkleIcon, SendIcon, StopIcon, TrashIcon, SearchIcon } from '../shared/icons.js';
import { Button, Input, Tabs, TabsList, TabsTrigger, TabsContent, ScrollArea, Badge, Separator, Alert, AlertDescription } from '../ui';
import { cn } from '../../lib/utils';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success" className="text-[10px]">{status}</Badge>;
      case 'running': return <Badge variant="info" className="text-[10px]">{status}</Badge>;
      case 'failed': return <Badge variant="destructive" className="text-[10px]">{status}</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <SparkleIcon className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearChat}
          className="h-6 w-6"
          title="Clear chat"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Warnings */}
      {!provider && (
        <Alert variant="warning" className="mx-3 mt-2 text-xs">
          <AlertDescription>
            No AI provider configured. Go to Settings to set up Ollama, OpenAI, or Anthropic.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mx-3 mt-2 text-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="px-3 py-2 border-b border-sidebar-border">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Chat Tab */}
          <TabsContent value="chat" className="m-0 p-0 flex-1">
            <div className="px-3 py-3 space-y-3 min-h-full">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
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
                  className={cn(
                    "flex",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.role === 'assistant'
                        ? 'bg-sidebar-accent text-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {message.content}
                    </pre>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-sidebar-accent rounded-lg px-3 py-2 text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="m-0 p-0">
            <div className="px-3 py-3 space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No tasks yet. Use chat to start a task.
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="bg-sidebar-accent rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{task.role}</span>
                      {getStatusBadge(task.status)}
                    </div>
                    <p className="text-muted-foreground text-xs mb-2">{task.description}</p>
                    {task.result && (
                      <pre className="bg-background rounded p-2 text-xs whitespace-pre-wrap">
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
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="m-0 p-0">
            <div className="px-3 py-3 space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search codebase..."
                  className="flex-1 bg-sidebar-accent/50 border-border"
                />
                <Button type="submit" size="icon">
                  <SearchIcon className="w-4 h-4" />
                </Button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <div key={index} className="bg-sidebar-accent rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-purple-400">
                          {result.chunk.metadata.path}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          score: {result.score.toFixed(3)}
                        </Badge>
                      </div>
                      <pre className="bg-background rounded p-2 text-xs whitespace-pre-wrap overflow-auto max-h-32">
                        {result.chunk.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Chat Input */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your code..."
              className="flex-1 bg-sidebar-accent/50 border-border"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              {isLoading ? <StopIcon className="w-4 h-4" /> : <SendIcon className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
