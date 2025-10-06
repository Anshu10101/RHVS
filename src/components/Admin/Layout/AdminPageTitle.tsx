import React, { ReactNode } from 'react';

interface AdminPageTitleProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function AdminPageTitle({ 
  title, 
  description, 
  icon, 
  actions 
}: AdminPageTitleProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 mb-6 border-b border-gray-200">
      <div className="flex items-center mb-4 md:mb-0">
        {icon && (
          <div className="mr-3 text-gray-700">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
}
