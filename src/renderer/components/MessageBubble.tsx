import { useState } from 'react';
import type { Message } from '../../shared/types';

interface MessageBubbleProps {
  message: Message;
  onFork?: () => void;
}

export default function MessageBubble({ message, onFork }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isInherited = message.is_inherited;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`group ${isInherited ? 'opacity-60' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            ${isUser ? 'bg-primary-600' : 'bg-surface-700'}
          `}
        >
          {isUser ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
          <div
            className={`
              inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed
              ${isUser
                ? 'bg-primary-600 text-white rounded-br-md'
                : 'bg-surface-800 text-surface-100 rounded-bl-md'
              }
            `}
          >
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          </div>

          {/* Meta */}
          <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : ''}`}>
            <span className="text-xs text-surface-500">{formatTime(message.timestamp)}</span>
            {isInherited && (
              <span className="text-xs text-surface-600 bg-surface-800 px-1.5 py-0.5 rounded">
                inherited
              </span>
            )}

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-surface-700 text-surface-500 hover:text-surface-300 transition-colors"
                  title="Copy message"
                >
                  {copied ? (
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
                {!isUser && onFork && (
                  <button
                    onClick={onFork}
                    className="p-1 rounded hover:bg-surface-700 text-surface-500 hover:text-primary-400 transition-colors"
                    title="Fork from this point"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
