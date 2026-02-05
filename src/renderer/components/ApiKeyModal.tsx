import { useState } from 'react';
import { useTreeStore } from '../store';

interface ApiKeyModalProps {
  onClose: () => void;
}

export default function ApiKeyModal({ onClose }: ApiKeyModalProps) {
  const { setApiKey, hasApiKey } = useTreeStore();
  const [key, setKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!key.trim()) {
      setError('Please enter your API key');
      return;
    }

    if (!key.startsWith('sk-ant-')) {
      setError('Invalid format. Anthropic keys start with "sk-ant-"');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await setApiKey(key.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-text/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-lg shadow-elevation-3 w-full max-w-sm mx-4">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Geometric key icon */}
              <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-text">Settings</h2>
                <p className="text-sm text-text-secondary">
                  {hasApiKey ? 'API key configured' : 'Configure API key'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-text-tertiary hover:text-text transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-text mb-2">
                Anthropic API Key
              </label>
              <input
                id="api-key"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={hasApiKey ? '••••••••••••••••' : 'sk-ant-api03-...'}
                className="w-full bg-canvas border border-border rounded px-4 py-3 text-sm text-text placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-error text-sm">
                <div className="w-1.5 h-1.5 bg-error rounded-full flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-text-tertiary leading-relaxed">
              Your key is stored locally and only sent to Anthropic.
              Get one at{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-border hover:bg-canvas text-text font-medium rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !key.trim()}
              className="flex-1 py-3 bg-primary hover:bg-primary-hover disabled:bg-border disabled:text-text-tertiary text-text-inverse font-medium rounded transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-text-inverse/30 border-t-text-inverse rounded-full animate-spin" />
                  <span>Saving</span>
                </>
              ) : (
                <span>{hasApiKey ? 'Update' : 'Save'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
