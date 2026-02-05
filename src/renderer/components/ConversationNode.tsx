import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useTreeStore } from '../store';
import type { ConversationNode } from '../../shared/types';

interface NodeData extends ConversationNode {
  selected: boolean;
}

function ConversationNodeComponent({ data, id }: NodeProps<Node & { data: NodeData }>) {
  const { updateNode, deleteNode, forkConversation } = useTreeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [showActions, setShowActions] = useState(false);

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle !== data.title) {
      updateNode({ id, title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleFork = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await forkConversation(id, `Fork of ${data.title}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation and all its branches?')) {
      deleteNode(id);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNode({ id, bookmarked: !data.bookmarked });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`
        min-w-[200px] max-w-[280px] rounded-lg border-2 transition-all duration-200
        ${data.selected
          ? 'bg-primary-900/50 border-primary-500 shadow-lg shadow-primary-500/20'
          : 'bg-surface-800 border-surface-700 hover:border-surface-600'
        }
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-surface-500 !border-2 !border-surface-700"
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary-500 !border-2 !border-primary-700"
      />

      {/* Header */}
      <div className="px-3 py-2 border-b border-surface-700/50">
        <div className="flex items-center justify-between gap-2">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              className="flex-1 bg-surface-900 border border-surface-600 rounded px-2 py-1 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className="flex-1 text-sm font-medium text-surface-100 truncate cursor-text"
              onDoubleClick={() => setIsEditing(true)}
              title={data.title}
            >
              {data.title}
            </h3>
          )}

          {data.bookmarked && (
            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-xs text-surface-500">
          {formatDate(data.updated_at)}
        </p>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {data.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-1.5 py-0.5 bg-surface-700 text-surface-300 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions (shown on hover) */}
      {showActions && (
        <div className="px-3 py-2 border-t border-surface-700/50 flex items-center gap-1">
          <button
            onClick={handleFork}
            className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-primary-400 transition-colors"
            title="Fork conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded hover:bg-surface-700 transition-colors ${
              data.bookmarked ? 'text-yellow-500' : 'text-surface-400 hover:text-yellow-400'
            }`}
            title={data.bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <svg className="w-4 h-4" fill={data.bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded hover:bg-red-900/50 text-surface-400 hover:text-red-400 transition-colors ml-auto"
            title="Delete conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ConversationNodeComponent);
