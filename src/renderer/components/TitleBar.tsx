interface TitleBarProps {
  onSettingsClick: () => void;
}

export default function TitleBar({ onSettingsClick }: TitleBarProps) {
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

      {/* Window Controls */}
      <div className="flex items-center no-drag">
        {/* Settings button */}
        <button
          onClick={onSettingsClick}
          className="w-11 h-11 flex items-center justify-center hover:bg-primary-light transition-colors"
          title="Settings"
        >
          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

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
