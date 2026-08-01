import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[var(--density-spacing-lg,1.5rem)]">
      <div>
        {breadcrumb && (
          <div className="text-sm text-muted-foreground mb-1">
            {breadcrumb}
          </div>
        )}
        <h1 className="text-h2 text-foreground font-bold">{title}</h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
