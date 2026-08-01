import React from 'react';

interface WorkspaceLayoutProps {
  header: React.ReactNode;
  filterBar?: React.ReactNode;
  children: React.ReactNode; // Main Workspace
  contextPanel?: React.ReactNode;
}

export function WorkspaceLayout({
  header,
  filterBar,
  children,
  contextPanel,
}: WorkspaceLayoutProps) {
  return (
    <div className="flex flex-col h-full w-full gap-[var(--density-spacing-md,1rem)]">
      {/* 1. Page Header */}
      <div className="flex-none">
        {header}
      </div>

      {/* 2. Filters / Search / Quick Actions */}
      {filterBar && (
        <div className="flex-none">
          {filterBar}
        </div>
      )}

      {/* 3. Main Workspace + 4. Context Panel */}
      <div className="flex flex-col lg:flex-row gap-[var(--density-spacing-md,1rem)] flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col">
          {children}
        </div>
        
        {contextPanel && (
          <div className="w-full lg:w-80 shrink-0 flex flex-col">
            {contextPanel}
          </div>
        )}
      </div>
    </div>
  );
}
