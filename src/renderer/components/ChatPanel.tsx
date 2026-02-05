import { useState, useRef, useEffect } from 'react';
import { useTreeStore } from '../store';
import MessageBubble from './MessageBubble';

export default function ChatPanel() {
  const {
    selectedNodeId,
    messages,
    nodes,
    isLoading,
    hasApiKey,
    addUserMessage,
    sendMessage,
    forkConversation,
    updateNode
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

    // Add user message
    await addUserMessage(selectedNodeId, content);

    // Get AI response
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
      <div className="h-full flex flex-col items-center justify-center text-surface-500 p-8">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-center">
          Select a conversation node from the tree
          <br />
          to view and continue the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-surface-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-surface-100 truncate">
              {selectedNode?.title || 'Conversation'}
            </h2>
            <p className="text-xs text-surface-500 mt-0.5">
              {nodeMessages.length} messages
            </p>
          </div>
          <button
            onClick={handleFork}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-lg text-sm transition-colors"
            title="Create a fork from this point"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Fork
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {nodeMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-surface-500">
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-sm text-center">
              Start your research conversation.
              <br />
              Ask a question to begin.
            </p>
          </div>
        ) : (
          <>
            {nodeMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onFork={() => forkConversation(selectedNodeId)}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-surface-400 text-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-surface-800 p-4">
        {!hasApiKey ? (
          <div className="text-center text-surface-500 text-sm py-2">
            Please configure your API key to start chatting
          </div>
        ) : (
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or continue the conversation..."
              className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-surface-100 placeholder-surface-500 resize-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isLoading}
              className="self-end px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-700 disabled:text-surface-500 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
