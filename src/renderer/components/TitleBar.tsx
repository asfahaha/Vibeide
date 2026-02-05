export default function TitleBar() {
  const handleMinimize = () => window.api.minimizeWindow();
  const handleMaximize = () => window.api.maximizeWindow();
  const handleClose = () => window.api.closeWindow();

  return (
    <div className="h-10 bg-surface-900 border-b border-surface-800 flex items-center justify-between px-4 drag-region">
      {/* macOS traffic lights spacer */}
      <div className="w-20 flex-shrink-0" />

      {/* Title */}
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="text-sm font-medium text-surface-200">Research Tree IDE</span>
      </div>

      {/* Window Controls (for Windows/Linux) */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-700 transition-colors"
          title="Minimize"
        >
          <svg className="w-4 h-4 text-surface-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-700 transition-colors"
          title="Maximize"
        >
          <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
            <rect x="4" y="4" width="12" height="12" strokeWidth="2" rx="1" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-600 transition-colors"
          title="Close"
        >
          <svg className="w-4 h-4 text-surface-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
