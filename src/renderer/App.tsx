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
    <div className="h-screen flex flex-col bg-surface-950">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Tree View - Left Panel */}
        <div className="flex-1 border-r border-surface-800">
          <TreeView />
        </div>

        {/* Chat Panel - Right Panel */}
        <div className="w-[480px] flex flex-col">
          <ChatPanel />
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900/90 border border-red-700 text-red-100 px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-100"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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
