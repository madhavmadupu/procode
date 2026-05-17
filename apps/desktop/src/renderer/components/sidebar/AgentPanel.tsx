import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAiStore } from '../../stores/ai.store.js';
import { useWorkspaceStore } from '../../stores/workspace.js';
import { SparkleIcon, SendIcon, StopIcon, TrashIcon, SearchIcon, CopyIcon, AtSignIcon, ChevronDownIcon } from '../shared/icons.js';
import { Button, Input, Tabs, TabsList, TabsTrigger, TabsContent, ScrollArea, Badge, Separator, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, Textarea } from '../ui';
import { cn } from '../../lib/utils';

interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  model?: string;
}

interface Mention {
  type: 'file' | 'symbol' | 'git-commit' | 'selection';
  value: string;
  label: string;
}

const SUGGESTED_PROMPTS = [
  "Explain the git blame implementation",
  "Write tests for the file system service",
  "What does the knowledge graph index?",
  "How does the tRPC IPC bridge work?",
];

const MODELS: Record<string, string[]> = {
  ollama: ["qwen2.5-coder:7b", "qwen2.5-coder:1.5b", "codellama:7b", "llama3.2:3b"],
  openai: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
  opencode: ["opencode-coder:7b", "opencode-coder:13b"],
};

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
    configureProvider,
    setProvider,
  } = useAiStore();

  const { rootPath } = useWorkspaceStore();
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'search'>('chat');
  const [selectedModel, setSelectedModel] = useState<string>(model || 'qwen2.5-coder:7b');
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (model) setSelectedModel(model);
  }, [model]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const context = mentions.map(m => `[${m.type}:${m.value}]`).join(' ');
    const fullMessage = context ? `${context}\n\n${input.trim()}` : input.trim();

    sendMessage(fullMessage);
    setInput('');
    setMentions([]);
  }, [input, isLoading, mentions, sendMessage]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === '@') {
      setShowMentionPicker(true);
    }
    if (e.key === 'Escape') {
      setShowMentionPicker(false);
      handleCancel();
    }
  }, [handleSubmit, handleCancel]);

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    if (provider) {
      configureProvider({ provider, model: newModel });
    }
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
  };

  const renderMessageContent = (content: string, role: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <p key={`text-${lastIndex}`} className="whitespace-pre-wrap text-sm">
            {content.slice(lastIndex, match.index)}
          </p>
        );
      }

      const lang = match[1] || 'text';
      const code = match[2] || '';
      parts.push(
        <CodeBlock key={`code-${match.index}`} language={lang} code={code} onCopy={handleCopyCode} />
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <p key={`text-${lastIndex}`} className="whitespace-pre-wrap text-sm">
          {content.slice(lastIndex)}
        </p>
      );
    }

    return parts.length > 0 ? parts : <p className="whitespace-pre-wrap text-sm">{content}</p>;
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

  const availableModels = provider ? MODELS[provider] || [] : [];

  return (
    <div className="flex flex-col h-full bg-editor">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-sidebar">
        <div className="flex items-center gap-2">
          <SparkleIcon className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">ProCode AI</span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="compact" className="text-xs gap-1 h-7">
                {selectedModel}
                <ChevronDownIcon className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {availableModels.map((m) => (
                <DropdownMenuItem key={m} onClick={() => handleModelChange(m)} className="text-xs">
                  {m}
                  {m === selectedModel && <Badge variant="outline" className="ml-auto text-[10px]">Active</Badge>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearChat} className="text-xs text-destructive">
                <TrashIcon className="w-3 h-3 mr-2" />
                Clear History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="px-3 py-1 border-b border-border bg-sidebar/50">
          <TabsList className="grid w-full grid-cols-3 h-7">
            <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Chat Tab */}
          <TabsContent value="chat" className="m-0 p-0 flex-1">
            <div className="px-3 py-3 space-y-4 min-h-full">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <SparkleIcon className="w-16 h-16 mb-4 text-purple-400/50" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">ProCode AI</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                    Ask anything about your codebase. Use @file to reference files, @symbol to reference functions.
                  </p>
                  <div className="space-y-2 w-full max-w-sm">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="w-full text-left px-4 py-2.5 rounded-lg border border-border bg-sidebar-accent/30 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
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
                  {message.role === 'user' ? (
                    <div className="max-w-[80%]">
                      <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-foreground">
                        {message.content}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 text-right">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[90%]">
                      <div className="bg-sidebar-accent/50 rounded-2xl rounded-tl-sm px-4 py-3 text-foreground">
                        {renderMessageContent(message.content, message.role)}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-sidebar-accent/50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  <div key={task.id} className="bg-sidebar-accent/50 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{task.role}</span>
                      {getStatusBadge(task.status)}
                    </div>
                    <p className="text-muted-foreground text-xs mb-2">{task.description}</p>
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
                    <div key={index} className="bg-sidebar-accent/50 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-purple-400">
                          {result.chunk?.metadata?.path || 'Unknown'}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          score: {result.score?.toFixed(3) || '0'}
                        </Badge>
                      </div>
                      <pre className="bg-background/50 rounded p-2 text-xs whitespace-pre-wrap overflow-auto max-h-32">
                        {result.chunk?.content || ''}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>

        {/* Chat Input */}
        {activeTab === 'chat' && (
          <div className="px-3 py-3 border-t border-border bg-sidebar">
            {mentions.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {mentions.map((m, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] gap-1">
                    @{m.label}
                    <button onClick={() => setMentions(mentions.filter((_, idx) => idx !== i))} className="ml-1 hover:text-foreground">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your code... (@ for mentions)"
                className="flex-1 bg-sidebar-accent/50 border-border resize-none text-sm pr-20"
                rows={2}
                disabled={isLoading}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowMentionPicker(!showMentionPicker)}
                  title="Add mention"
                >
                  <AtSignIcon className="w-3.5 h-3.5" />
                </Button>
                {isLoading ? (
                  <Button variant="destructive" size="icon" className="h-7 w-7" onClick={handleCancel}>
                    <StopIcon className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button size="icon" className="h-7 w-7" onClick={() => handleSubmit()} disabled={!input.trim()}>
                    <SendIcon className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">
                {provider ? `${provider} · ${selectedModel}` : 'No provider configured'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Enter to send · Shift+Enter for new line
              </span>
            </div>
          </div>
        )}
      </Tabs>

      {/* Mention Picker */}
      {showMentionPicker && (
        <div className="absolute bottom-20 left-3 right-3 z-50">
          <Command className="border border-border rounded-lg shadow-lg">
            <CommandInput placeholder="Type to search files, symbols..." onValueChange={setMentionFilter} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Context">
                <CommandItem onSelect={() => { setMentions([...mentions, { type: 'selection', value: 'selection', label: 'selection' }]); setShowMentionPicker(false); }}>
                  @selection — Current editor selection
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Files">
                <CommandItem onSelect={() => { setMentions([...mentions, { type: 'file', value: 'src/main.ts', label: 'src/main.ts' }]); setShowMentionPicker(false); }}>
                  @file — src/main.ts
                </CommandItem>
                <CommandItem onSelect={() => { setMentions([...mentions, { type: 'file', value: 'package.json', label: 'package.json' }]); setShowMentionPicker(false); }}>
                  @file — package.json
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

interface CodeBlockProps {
  language: string;
  code: string;
  onCopy: (code: string) => void;
}

function CodeBlock({ language, code, onCopy }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-sidebar-accent/80 border-b border-border">
        <Badge variant="outline" className="text-[10px]">{language}</Badge>
        <Button variant="ghost" size="compact" className="h-5 text-xs gap-1" onClick={handleCopy}>
          <CopyIcon className="w-3 h-3" />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="p-3 text-xs overflow-x-auto bg-editor/50">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
