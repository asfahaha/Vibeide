import { useEffect } from 'react';
import { useTreeStore } from './store';
import TitleBar from './components/TitleBar';
import TreeView from './components/TreeView';
import ChatPanel from './components/ChatPanel';
import ApiKeyModal from './components/ApiKeyModal';

export default function App() {
  const { loadData, checkApiKey, hasApiKey, error, setError } = useTreeStore();

  useEffect(() => {
    loadData();
    checkApiKey();
  }, [loadData, checkApiKey]);

  return (
    <div className="h-screen flex flex-col bg-canvas">
      <TitleBar />

      <main className="flex-1 flex overflow-hidden">
        {/* Tree View - Left Panel */}
        <div className="flex-1 border-r border-border">
          <TreeView />
        </div>

        {/* Chat Panel - Right Panel */}
        <aside className="w-[420px] flex flex-col border-l border-border">
          <ChatPanel />
        </aside>
      </main>

      {/* Error Toast - Bauhaus style */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-surface border border-error/30 shadow-elevation-2 px-4 py-3 rounded max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-error rounded-full mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-text">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-text-tertiary hover:text-text transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {!hasApiKey && <ApiKeyModal />}
    </div>
  );
}
