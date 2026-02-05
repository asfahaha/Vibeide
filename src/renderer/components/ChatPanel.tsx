import { useState, useRef, useEffect } from 'react';
import { useTreeStore } from '../store';
import MessageBubble from './MessageBubble';

interface ChatPanelProps {
  onConfigureApiKey: () => void;
}

export default function ChatPanel({ onConfigureApiKey }: ChatPanelProps) {
  const {
    selectedNodeId,
    messages,
    nodes,
    isLoading,
    hasApiKey,
    addUserMessage,
    sendMessage,
    forkConversation
  } = useTreeStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const nodeMessages = selectedNodeId ? messages[selectedNodeId] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [nodeMessages]);

  useEffect(() => {
    if (selectedNodeId) {
      inputRef.current?.focus();
    }
  }, [selectedNodeId]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || !selectedNodeId || !hasApiKey || isLoading) return;

    const content = inputValue.trim();
    setInputValue('');

    await addUserMessage(selectedNodeId, content);
    await sendMessage(selectedNodeId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFork = async () => {
    if (!selectedNodeId) return;
    await forkConversation(selectedNodeId);
  };

  if (!selectedNodeId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-tertiary p-8 bg-surface">
        <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm text-center leading-relaxed">
          Select a node from the tree
          <br />
          to view the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-text truncate">
              {selectedNode?.title || 'Conversation'}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              {nodeMessages.filter(m => !m.is_inherited).length} messages in this branch
            </p>
          </div>
          <button
            onClick={handleFork}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-text-tertiary hover:bg-primary-light text-text-secondary hover:text-primary rounded text-sm transition-colors"
            title="Create a fork from this point"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Fork
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {nodeMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-tertiary">
            <div className="w-10 h-10 rounded border border-border flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-sm text-center">
              Start your research.
              <br />
              Ask a question below.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {nodeMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onFork={() => forkConversation(selectedNodeId)}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-text-tertiary text-sm py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-subtle" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-subtle" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse-subtle" style={{ animationDelay: '400ms' }} />
                </div>
                <span>Thinking</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <footer className="flex-shrink-0 border-t border-border p-4">
        {!hasApiKey ? (
          <div className="text-center py-2">
            <p className="text-text-tertiary text-sm mb-3">
              Configure your API key to chat with Claude
            </p>
            <button
              onClick={onConfigureApiKey}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-inverse text-sm font-medium rounded transition-colors"
            >
              Configure API Key
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1 bg-canvas border border-border rounded px-4 py-3 text-sm text-text placeholder-text-tertiary resize-none focus:outline-none focus:border-primary transition-colors"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isLoading}
              className="self-end w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary-hover disabled:bg-border disabled:text-text-tertiary text-text-inverse rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
