import React from 'react';

export interface FileTabsProps {
  files: string[];
  activeFile: string;
  onTabClick: (file: string) => void;
}

/**
 * Retorna as classes Tailwind para um tab, variando conforme esteja ativo ou não.
 */
function getTabClass(isActive: boolean): string {
  const base = "px-3 py-2 font-medium text-sm rounded-t-md focus:outline-none transition-colors duration-200";
  const active = "bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400 border-b-2 border-blue-500";
  const inactive = "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200";
  return `${base} ${isActive ? active : inactive}`;
}

/**
 * Renderiza uma barra de abas para arquivos e chama onTabClick ao selecionar.
 */
export default function FileTabs({ files, activeFile, onTabClick }: FileTabsProps) {
  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <nav className="flex space-x-2 px-4" aria-label="Files">
        {files.map((file) => {
          const isActive = activeFile === file;
          return (
            <button
              key={file}
              onClick={() => onTabClick(file)}
              className={getTabClass(isActive)}
              aria-current={isActive ? 'page' : undefined}
            >
              {file}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
