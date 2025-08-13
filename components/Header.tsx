import React from 'react';
import { Eye, EyeOff, FileDown, Loader, Moon, Sun, Undo, Redo } from 'lucide-react';

export interface HeaderProps {
  onTogglePreview: () => void;
  isPreviewVisible: boolean;
  onGeneratePdf: () => void;
  isGeneratingPdf: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isMarkdownActive: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface ActionButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
  title?: string;
}

/**
 * Renderiza um botão de ação estilizado e acessível.
 */
function ActionButton({ onClick, disabled, children, ariaLabel, title }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

/**
 * Exibe uma linha vertical usada para separar grupos de ações no cabeçalho.
 */
function Divider() {
  return <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />;
}

/**
 * Cabeçalho da aplicação com controles de desfazer/refazer, preview, geração de PDF e alternância de tema.
 */
export default function Header({
  onTogglePreview,
  isPreviewVisible,
  onGeneratePdf,
  isGeneratingPdf,
  isDarkMode,
  onToggleDarkMode,
  isMarkdownActive,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: HeaderProps) {
  const previewAria = isPreviewVisible ? 'Hide Preview' : 'Show Preview';
  const previewTitle = !isMarkdownActive ? 'Preview is only available for Markdown files' : undefined;
  const pdfTitle = !isMarkdownActive ? 'PDF generation is only available for Markdown files' : undefined;

  return (
    <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-3">
            <img alt="VixeText Logo" height={32} width={32} src="https://vixetext.com/img/logo.png" />
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">VixeText Playground</h1>
          </div>

          <div className="flex items-center space-x-1">
            <ActionButton onClick={onUndo} disabled={!canUndo} ariaLabel="Undo">
              <Undo size={20} />
            </ActionButton>
            <ActionButton onClick={onRedo} disabled={!canRedo} ariaLabel="Redo">
              <Redo size={20} />
            </ActionButton>

            <Divider />

            <div title={previewTitle}>
              <ActionButton onClick={onTogglePreview} disabled={!isMarkdownActive} ariaLabel={previewAria}>
                {isPreviewVisible && isMarkdownActive ? <EyeOff size={20} /> : <Eye size={20} />}
              </ActionButton>
            </div>

            <div title={pdfTitle}>
              <ActionButton onClick={onGeneratePdf} disabled={isGeneratingPdf || !isMarkdownActive} ariaLabel="Generate PDF">
                {isGeneratingPdf ? <Loader size={20} className="animate-spin" /> : <FileDown size={20} />}
              </ActionButton>
            </div>

            <Divider />

            <ActionButton onClick={onToggleDarkMode} ariaLabel={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </ActionButton>
          </div>
        </div>
      </div>
    </header>
  );
}
