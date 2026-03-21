import React from 'react';

type PageContainerProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Job tools page wrapper: title, description, and consistent max-width for mobile/desktop.
 */
export function PageContainer({ title, description, children, className = '' }: PageContainerProps) {
  return (
    <div className={`flex flex-col w-full max-w-[428px] md:max-w-4xl mx-auto px-4 py-4 md:py-6 ${className}`}>
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
