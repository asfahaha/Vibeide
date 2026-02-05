export default function TitleBar() {
  const handleMinimize = () => window.api.minimizeWindow();
  const handleMaximize = () => window.api.maximizeWindow();
  const handleClose = () => window.api.closeWindow();

  return (
    <header className="h-11 bg-surface border-b border-border flex items-center justify-between px-4 drag-region">
      {/* macOS traffic lights spacer */}
      <div className="w-20 flex-shrink-0" />

      {/* Title - Bauhaus typography */}
      <div className="flex items-center gap-2">
        {/* Geometric logo mark */}
        <div className="w-5 h-5 relative">
          <div className="absolute inset-0 bg-primary rounded-sm" />
          <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-surface rounded-full" />
        </div>
        <span className="text-sm font-medium text-text tracking-tight">
          Research Tree
        </span>
      </div>

      {/* Window Controls (for Windows/Linux) */}
      <div className="flex items-center no-drag">
        <button
          onClick={handleMinimize}
          className="w-11 h-11 flex items-center justify-center hover:bg-primary-light transition-colors"
          title="Minimize"
        >
          <svg className="w-3 h-[1.5px]" fill="currentColor" viewBox="0 0 12 2">
            <rect width="12" height="1.5" rx="0.5" className="text-text-secondary" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-11 flex items-center justify-center hover:bg-primary-light transition-colors"
          title="Maximize"
        >
          <svg className="w-3 h-3 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 12 12" strokeWidth="1.5">
            <rect x="1" y="1" width="10" height="10" rx="1" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-11 flex items-center justify-center hover:bg-error hover:text-text-inverse transition-colors"
          title="Close"
        >
          <svg className="w-3 h-3 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 12 12" strokeWidth="1.5">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>
      </div>
    </header>
  );
}
