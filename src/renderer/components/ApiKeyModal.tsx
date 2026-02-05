import { useState } from 'react';
import { useTreeStore } from '../store';

export default function ApiKeyModal() {
  const { setApiKey } = useTreeStore();
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
      setError('Invalid API key format. Anthropic API keys start with "sk-ant-"');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await setApiKey(key.trim());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-100">API Key Required</h2>
              <p className="text-sm text-surface-400">Connect to Claude to start researching</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-surface-300 mb-2">
                Anthropic API Key
              </label>
              <input
                id="api-key"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full bg-surface-800 border border-surface-600 rounded-lg px-4 py-3 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="bg-surface-800/50 rounded-lg p-4">
              <p className="text-xs text-surface-400 leading-relaxed">
                Your API key is stored locally and never sent to any server except Anthropic's API.
                You can get your API key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 underline"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting || !key.trim()}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-700 disabled:text-surface-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Connect to Claude</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
