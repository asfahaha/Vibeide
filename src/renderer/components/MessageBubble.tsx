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
      className={`group ${isInherited ? 'opacity-50' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Role indicator - geometric shapes */}
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-6 h-6 bg-primary rounded-full" />
          ) : (
            <div className="w-6 h-6 bg-text rounded" />
          )}
        </div>

        {/* Content */}
        <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
          <div
            className={`
              inline-block px-4 py-3 text-sm leading-relaxed
              ${isUser
                ? 'bg-primary text-text-inverse rounded rounded-br-sm'
                : 'bg-canvas text-text border border-border rounded rounded-bl-sm'
              }
            `}
          >
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          </div>

          {/* Meta */}
          <div className={`flex items-center gap-2 mt-1.5 ${isUser ? 'justify-end' : ''}`}>
            <span className="text-xs text-text-tertiary">{formatTime(message.timestamp)}</span>
            {isInherited && (
              <span className="text-xs text-text-tertiary bg-canvas border border-border px-1.5 py-0.5 rounded-sm">
                inherited
              </span>
            )}

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-primary-light text-text-tertiary hover:text-primary transition-colors"
                  title="Copy message"
                >
                  {copied ? (
                    <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                  )}
                </button>
                {!isUser && onFork && (
                  <button
                    onClick={onFork}
                    className="p-1 rounded hover:bg-primary-light text-text-tertiary hover:text-accent transition-colors"
                    title="Fork from this point"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
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
