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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
    setConfirmingDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDelete(false);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNode({ id, bookmarked: !data.bookmarked });
  };

  const handleMouseLeave = () => {
    setShowActions(false);
    setConfirmingDelete(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`
        min-w-[180px] max-w-[240px] bg-surface rounded border transition-all duration-150
        ${data.selected
          ? 'border-primary shadow-elevation-2 ring-2 ring-primary ring-opacity-20'
          : 'border-border shadow-elevation-1 hover:shadow-elevation-2 hover:border-text-tertiary'
        }
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-border !border-0 !-left-1"
      />

      {/* Output Handle - Accent color for branch points */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-accent !border-0 !-right-1"
      />

      {/* Header */}
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              className="flex-1 bg-canvas border border-border rounded px-2 py-1 text-sm text-text focus:outline-none focus:border-primary"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className="flex-1 text-sm font-medium text-text truncate cursor-text leading-tight"
              onDoubleClick={() => setIsEditing(true)}
              title={data.title}
            >
              {data.title}
            </h3>
          )}

          {data.bookmarked && (
            <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1" />
          )}
        </div>

        {/* Meta */}
        <p className="text-xs text-text-tertiary mt-1">
          {formatDate(data.updated_at)}
        </p>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {data.tags.slice(0, 2).map((tag: string, index: number) => (
              <span
                key={index}
                className="px-1.5 py-0.5 bg-canvas text-text-secondary rounded-sm text-xs"
              >
                {tag}
              </span>
            ))}
            {data.tags.length > 2 && (
              <span className="text-xs text-text-tertiary">
                +{data.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions (shown on hover) */}
      {showActions && (
        <div className="px-2 py-1.5 border-t border-border flex items-center gap-0.5">
          <button
            onClick={handleFork}
            className="p-1.5 rounded hover:bg-primary-light text-text-secondary hover:text-primary transition-colors"
            title="Fork conversation"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded hover:bg-primary-light transition-colors ${
              data.bookmarked ? 'text-accent' : 'text-text-secondary hover:text-accent'
            }`}
            title={data.bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <svg className="w-3.5 h-3.5" fill={data.bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <div className="flex-1" />
          {confirmingDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-error mr-1">Delete?</span>
              <button
                onClick={handleConfirmDelete}
                className="px-1.5 py-0.5 rounded text-xs bg-error text-white"
              >
                Yes
              </button>
              <button
                onClick={handleCancelDelete}
                className="px-1.5 py-0.5 rounded text-xs border border-border"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
              title="Delete conversation"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(ConversationNodeComponent);
